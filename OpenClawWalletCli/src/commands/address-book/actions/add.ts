import pc from "picocolors";
import { getConfig, updateConfig } from "../../../utils/config.js";
import { promptText } from "../../../utils/prompts.js";
import {
  parseContactName,
  validateAndNormalizeAddress,
  checkContactNameExists,
} from "../helps.js";

export async function addAction(name?: string, address?: string): Promise<void> {
  let contactName = name?.trim();
  if (!contactName) {
    contactName = await promptText("Contact name");
  }
  const parsedName = parseContactName(contactName);

  if (checkContactNameExists(parsedName)) {
    throw new Error(`Contact "${parsedName}" already exists. Use 'update' command to modify.`);
  }

  let contactAddress = address?.trim();
  if (!contactAddress) {
    contactAddress = await promptText("CKB address");
  }
  const validatedAddress = validateAndNormalizeAddress(contactAddress);

  const config = getConfig();
  const addressBook = config.addressBook || {};
  updateConfig({
    addressBook: {
      ...addressBook,
      [parsedName]: validatedAddress,
    },
  });

  console.log(pc.green(`Contact "${parsedName}" added to address book.`));
  console.log(pc.dim(`Address: ${validatedAddress}`));
}
