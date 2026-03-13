import type {
  AddressBookChain,
  AddressBookContactAddressesDto,
  AddressBookContactDto,
  AddressBookContactSummaryDto,
  AddressBookCreateRequest,
  AddressBookCreateResponse,
  AddressBookDeleteRequest,
  AddressBookDeleteResponse,
  AddressBookGetAllResponse,
  AddressBookGetResponse,
  AddressBookListResponse,
  AddressBookLookupByAddressResponse,
  AddressBookSearchResponse,
  AddressBookUpdateRequest,
  AddressBookUpdateResponse,
} from "@superise/app-contracts";
import {
  createAddressBookContact,
  createAuditLog,
  updateAddressBookContact,
  WalletDomainError,
  type ActorRole,
  type AddressBookContact,
  type ChainKind,
  type TransferTargetType,
} from "@superise/domain";
import {
  toErrorMessage,
  type JsonValue,
} from "@superise/shared";
import type {
  CkbWalletAdapter,
  EvmWalletAdapter,
  RepositoryBundle,
  UnitOfWork,
} from "../ports";

type AddressNormalizerPorts = {
  ckb?: Pick<CkbWalletAdapter, "normalizeAddress">;
  evm?: Pick<EvmWalletAdapter, "normalizeAddress">;
};

type NormalizedContactInput = {
  name: string;
  normalizedName: string;
  note: string | null;
  nervosAddress: string | null;
  normalizedNervosAddress: string | null;
  ethereumAddress: string | null;
  normalizedEthereumAddress: string | null;
};

export type ResolvedTransferTarget = {
  toType: "address" | "contact_name";
  targetType: TransferTargetType;
  inputValue: string;
  resolvedAddress: string;
  resolvedContactName: string | null;
};

export class AddressBookService {
  constructor(
    private readonly repos: RepositoryBundle,
    private readonly unitOfWork: UnitOfWork,
    private readonly ckb: Pick<CkbWalletAdapter, "normalizeAddress">,
    private readonly evm: Pick<EvmWalletAdapter, "normalizeAddress">,
  ) {}

  async list(): Promise<AddressBookListResponse> {
    const contacts = await this.repos.addressBooks.listAll();
    return {
      contacts: contacts.map(mapContactToSummary),
    };
  }

  async search(query: string): Promise<AddressBookSearchResponse> {
    const normalizedQuery = normalizeName(query, "query");
    const contacts = await this.repos.addressBooks.searchByNormalizedName(
      normalizedQuery,
    );

    return {
      contacts: contacts.map(mapContactToSummary),
    };
  }

  async get(name: string): Promise<AddressBookGetResponse> {
    const contact = await this.requireContactByExactName(name);
    return {
      contact: mapContactToDto(contact),
    };
  }

  async getAll(): Promise<AddressBookGetAllResponse> {
    const contacts = await this.repos.addressBooks.listAll();
    return {
      contacts: contacts.map(mapContactToDto),
    };
  }

  async lookupByAddress(address: string): Promise<AddressBookLookupByAddressResponse> {
    const trimmedAddress = normalizeRequiredString(address, "address");
    const detected = await detectLookupAddress(trimmedAddress, {
      ckb: this.ckb,
      evm: this.evm,
    });

    if (!detected) {
      return {
        address: trimmedAddress,
        matched: false,
        contacts: [],
      };
    }

    const contacts = await this.repos.addressBooks.listByNormalizedAddress(
      detected.chain,
      detected.normalizedAddress,
    );

    return {
      address: trimmedAddress,
      chain: toPublicChain(detected.chain),
      matched: contacts.length > 0,
      contacts: contacts.map((contact) => contact.name),
    };
  }

  async create(
    actorRole: Extract<ActorRole, "AGENT" | "OWNER">,
    request: AddressBookCreateRequest,
  ): Promise<AddressBookCreateResponse> {
    const normalized = await normalizeContactInput(request.contact, {
      ckb: this.ckb,
      evm: this.evm,
    });
    const existing = await this.repos.addressBooks.getByNormalizedName(
      normalized.normalizedName,
    );

    if (existing) {
      throw new WalletDomainError(
        "ADDRESS_BOOK_CONTACT_ALREADY_EXISTS",
        `Address book contact already exists: ${normalized.name}`,
      );
    }

    const contact = createAddressBookContact(normalized);

    await this.unitOfWork.run(async (repos) => {
      await repos.addressBooks.save(contact);
      await repos.audits.save(
        createAuditLog({
          actorRole,
          action: "address_book.create",
          result: "SUCCESS",
          metadata: {
            name: contact.name,
            chains: buildChains(contact),
          },
        }),
      );
    });

    return {
      contact: mapContactToDto(contact),
    };
  }

  async update(
    actorRole: Extract<ActorRole, "AGENT" | "OWNER">,
    request: AddressBookUpdateRequest,
  ): Promise<AddressBookUpdateResponse> {
    const current = await this.requireContactByExactName(request.currentName);
    const normalized = await normalizeContactInput(request.contact, {
      ckb: this.ckb,
      evm: this.evm,
    });
    const conflicting = await this.repos.addressBooks.getByNormalizedName(
      normalized.normalizedName,
    );

    if (conflicting && conflicting.contactId !== current.contactId) {
      throw new WalletDomainError(
        "ADDRESS_BOOK_CONTACT_ALREADY_EXISTS",
        `Address book contact already exists: ${normalized.name}`,
      );
    }

    const contact = updateAddressBookContact(current, normalized);

    await this.unitOfWork.run(async (repos) => {
      await repos.addressBooks.save(contact);
      await repos.audits.save(
        createAuditLog({
          actorRole,
          action: "address_book.update",
          result: "SUCCESS",
          metadata: {
            currentName: current.name,
            nextName: contact.name,
            chains: buildChains(contact),
          },
        }),
      );
    });

    return {
      contact: mapContactToDto(contact),
    };
  }

  async delete(
    actorRole: Extract<ActorRole, "AGENT" | "OWNER">,
    request: AddressBookDeleteRequest,
  ): Promise<AddressBookDeleteResponse> {
    const contact = await this.requireContactByExactName(request.name);

    await this.unitOfWork.run(async (repos) => {
      const deleted = await repos.addressBooks.deleteById(contact.contactId);
      if (!deleted) {
        throw new WalletDomainError(
          "ADDRESS_BOOK_CONTACT_NOT_FOUND",
          `Address book contact not found: ${request.name}`,
        );
      }

      await repos.audits.save(
        createAuditLog({
          actorRole,
          action: "address_book.delete",
          result: "SUCCESS",
          metadata: {
            name: contact.name,
            chains: buildChains(contact),
          },
        }),
      );
    });

    return {
      deleted: true,
      name: contact.name,
    };
  }

  private async requireContactByExactName(name: string): Promise<AddressBookContact> {
    const exactName = normalizeRequiredString(name, "name");
    const contact = await this.repos.addressBooks.getByName(exactName);

    if (!contact) {
      throw new WalletDomainError(
        "ADDRESS_BOOK_CONTACT_NOT_FOUND",
        `Address book contact not found: ${exactName}`,
      );
    }

    return contact;
  }
}

export class TransferTargetResolverService {
  constructor(
    private readonly addressBooks: RepositoryBundle["addressBooks"],
    private readonly normalizers: AddressNormalizerPorts,
  ) {}

  async resolve(
    chain: ChainKind,
    input: {
      to: string;
      toType?: "address" | "contact_name";
    },
  ): Promise<ResolvedTransferTarget> {
    const rawTarget = normalizeRequiredString(input.to, "to");
    const requestedToType = input.toType ?? "address";

    if (requestedToType === "address") {
      return {
        toType: "address",
        targetType: "ADDRESS",
        inputValue: rawTarget,
        resolvedAddress: await normalizeAddressForChain(
          chain,
          rawTarget,
          this.normalizers,
        ),
        resolvedContactName: null,
      };
    }

    const contact = await this.addressBooks.getByName(rawTarget);
    if (!contact) {
      throw new WalletDomainError(
        "ADDRESS_BOOK_CONTACT_NOT_FOUND",
        `Address book contact not found: ${rawTarget}`,
      );
    }

    const chainAddress =
      chain === "ckb" ? contact.nervosAddress : contact.ethereumAddress;
    if (!chainAddress) {
      throw new WalletDomainError(
        "ADDRESS_BOOK_ADDRESS_NOT_FOUND_FOR_CHAIN",
        `Contact ${contact.name} does not have a ${toPublicChain(chain)} address`,
      );
    }

    return {
      toType: "contact_name",
      targetType: "CONTACT_NAME",
      inputValue: rawTarget,
      resolvedAddress: await normalizeAddressForChain(
        chain,
        chainAddress,
        this.normalizers,
      ),
      resolvedContactName: contact.name,
    };
  }
}

function mapContactToSummary(contact: AddressBookContact): AddressBookContactSummaryDto {
  return {
    name: contact.name,
    note: contact.note,
    chains: buildChains(contact),
    updatedAt: contact.updatedAt,
  };
}

function mapContactToDto(contact: AddressBookContact): AddressBookContactDto {
  return {
    name: contact.name,
    note: contact.note,
    addresses: {
      nervosAddress: contact.nervosAddress,
      ethereumAddress: contact.ethereumAddress,
    },
    createdAt: contact.createdAt,
    updatedAt: contact.updatedAt,
  };
}

function buildChains(contact: AddressBookContact): AddressBookChain[] {
  const chains: AddressBookChain[] = [];

  if (contact.nervosAddress) {
    chains.push("NERVOS");
  }

  if (contact.ethereumAddress) {
    chains.push("ETHEREUM");
  }

  return chains;
}

async function normalizeContactInput(
  input: {
    name: string;
    note?: string | null;
    addresses: AddressBookContactAddressesDto;
  },
  normalizers: AddressNormalizerPorts,
): Promise<NormalizedContactInput> {
  const name = normalizeRequiredString(input.name, "name");
  const note = normalizeOptionalNote(input.note);
  const [nervos, ethereum] = await Promise.all([
    normalizeOptionalChainAddress("ckb", input.addresses.nervosAddress, normalizers),
    normalizeOptionalChainAddress("evm", input.addresses.ethereumAddress, normalizers),
  ]);

  if (!nervos.original && !ethereum.original) {
    throw new WalletDomainError(
      "ADDRESS_BOOK_CONTACT_EMPTY",
      "Address book contact must keep at least one chain address",
    );
  }

  return {
    name,
    normalizedName: name.toLowerCase(),
    note,
    nervosAddress: nervos.original,
    normalizedNervosAddress: nervos.normalized,
    ethereumAddress: ethereum.original,
    normalizedEthereumAddress: ethereum.normalized,
  };
}

async function normalizeOptionalChainAddress(
  chain: ChainKind,
  value: string | null | undefined,
  normalizers: AddressNormalizerPorts,
): Promise<{ original: string | null; normalized: string | null }> {
  if (value === null || value === undefined) {
    return {
      original: null,
      normalized: null,
    };
  }

  const original = normalizeRequiredString(
    value,
    chain === "ckb" ? "nervosAddress" : "ethereumAddress",
  );

  try {
    return {
      original,
      normalized: await normalizeAddressForChain(chain, original, normalizers),
    };
  } catch (error) {
    const code =
      chain === "ckb"
        ? "ADDRESS_BOOK_INVALID_NERVOS_ADDRESS"
        : "ADDRESS_BOOK_INVALID_ETHEREUM_ADDRESS";
    throw new WalletDomainError(code, toErrorMessage(error));
  }
}

async function detectLookupAddress(
  address: string,
  normalizers: AddressNormalizerPorts,
): Promise<{
  chain: ChainKind;
  normalizedAddress: string;
} | null> {
  const candidates: ChainKind[] = address.startsWith("0x") ? ["evm", "ckb"] : ["ckb", "evm"];

  for (const chain of candidates) {
    try {
      return {
        chain,
        normalizedAddress: await normalizeAddressForChain(chain, address, normalizers),
      };
    } catch {
      continue;
    }
  }

  return null;
}

async function normalizeAddressForChain(
  chain: ChainKind,
  address: string,
  normalizers: AddressNormalizerPorts,
): Promise<string> {
  const normalizer = chain === "ckb" ? normalizers.ckb : normalizers.evm;
  if (!normalizer) {
    throw new WalletDomainError(
      "CHAIN_UNAVAILABLE",
      `Missing ${chain} address normalizer`,
    );
  }

  return normalizer.normalizeAddress(address);
}

function normalizeName(value: string, fieldName: string): string {
  return normalizeRequiredString(value, fieldName).toLowerCase();
}

function normalizeOptionalNote(value: string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function normalizeRequiredString(value: string, fieldName: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new WalletDomainError(
      "VALIDATION_ERROR",
      `${fieldName} must not be empty`,
    );
  }

  return trimmed;
}

function toPublicChain(chain: ChainKind): "nervos" | "ethereum" {
  return chain === "ckb" ? "nervos" : "ethereum";
}

export function extractLimitFailureContext(error: unknown): {
  limitWindow: "DAILY" | "WEEKLY" | "MONTHLY" | null;
  limitSnapshot: JsonValue | null;
} {
  if (!(error instanceof WalletDomainError) || error.code !== "ASSET_LIMIT_EXCEEDED") {
    return {
      limitWindow: null,
      limitSnapshot: null,
    };
  }

  const limitWindow = readLimitWindow(error.details);

  return {
    limitWindow,
    limitSnapshot: (error.details as JsonValue | undefined) ?? null,
  };
}

function readLimitWindow(value: unknown): "DAILY" | "WEEKLY" | "MONTHLY" | null {
  if (!value || typeof value !== "object" || !("limit" in value)) {
    return null;
  }

  const limit = value.limit;
  if (!limit || typeof limit !== "object" || !("window" in limit)) {
    return null;
  }

  const window = limit.window;
  return window === "DAILY" || window === "WEEKLY" || window === "MONTHLY"
    ? window
    : null;
}
