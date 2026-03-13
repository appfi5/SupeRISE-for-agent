import type {
  AddressBookContactDto,
  AddressBookLookupByAddressResponse,
} from "@superise/app-contracts";
import type { AddressBookEditorState } from "../types/app-state";

type AddressBookPanelProps = {
  contacts: AddressBookContactDto[];
  editor: AddressBookEditorState;
  filter: string;
  lookupAddress: string;
  lookupResult: AddressBookLookupByAddressResponse | null;
  onDelete: () => void;
  onEditorChange: (
    field: keyof Omit<AddressBookEditorState, "currentName">,
    value: string,
  ) => void;
  onFilterChange: (value: string) => void;
  onLookup: () => void;
  onLookupAddressChange: (value: string) => void;
  onReset: () => void;
  onSave: () => void;
  onSelectContact: (contact: AddressBookContactDto) => void;
};

export function AddressBookPanel({
  contacts,
  editor,
  filter,
  lookupAddress,
  lookupResult,
  onDelete,
  onEditorChange,
  onFilterChange,
  onLookup,
  onLookupAddressChange,
  onReset,
  onSave,
  onSelectContact,
}: AddressBookPanelProps) {
  const normalizedFilter = filter.trim().toLowerCase();
  const filteredContacts =
    normalizedFilter.length === 0
      ? contacts
      : contacts.filter((contact) =>
          `${contact.name} ${contact.note ?? ""}`.toLowerCase().includes(normalizedFilter),
        );

  return (
    <section className="panel address-book-panel">
      <div className="address-book-header">
        <div>
          <h2>地址簿</h2>
          <p className="lede compact">
            这里维护共享联系人和两条链的地址映射；转账时可直接填联系人名称。
          </p>
        </div>
        <button className="button ghost" onClick={onReset}>
          新建联系人
        </button>
      </div>

      <div className="address-book-grid">
        <div className="address-book-column">
          <label className="field">
            <span>按名称筛选</span>
            <input
              placeholder="输入联系人名称"
              value={filter}
              onChange={(event) => onFilterChange(event.target.value)}
            />
          </label>
          <div className="contact-list">
            {filteredContacts.length === 0 ? (
              <div className="empty-state">当前没有匹配的联系人。</div>
            ) : (
              filteredContacts.map((contact) => {
                const selected =
                  editor.currentName === contact.name || editor.name === contact.name;

                return (
                  <button
                    key={contact.name}
                    className={`contact-list-item ${selected ? "active" : ""}`}
                    onClick={() => onSelectContact(contact)}
                    type="button"
                  >
                    <div className="contact-list-title">
                      <strong>{contact.name}</strong>
                      <span>{contact.note || "无备注"}</span>
                    </div>
                    <div className="chip-row">
                      {(contact.addresses.nervosAddress ? ["NERVOS"] : [])
                        .concat(contact.addresses.ethereumAddress ? ["ETHEREUM"] : [])
                        .map((chain) => (
                          <span key={chain} className="chain-chip">
                            {chain}
                          </span>
                        ))}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="address-book-column">
          <label className="field">
            <span>联系人名称</span>
            <input
              placeholder="例如 Alice Treasury"
              value={editor.name}
              onChange={(event) => onEditorChange("name", event.target.value)}
            />
          </label>
          <label className="field">
            <span>备注</span>
            <textarea
              rows={3}
              placeholder="例如 OTC 柜台或托管地址"
              value={editor.note}
              onChange={(event) => onEditorChange("note", event.target.value)}
            />
          </label>
          <label className="field">
            <span>Nervos 地址</span>
            <input
              placeholder="ckt... 或 ckb..."
              value={editor.nervosAddress}
              onChange={(event) => onEditorChange("nervosAddress", event.target.value)}
            />
          </label>
          <label className="field">
            <span>Ethereum 地址</span>
            <input
              placeholder="0x..."
              value={editor.ethereumAddress}
              onChange={(event) => onEditorChange("ethereumAddress", event.target.value)}
            />
          </label>

          <div className="inline-actions">
            <button className="button primary" onClick={onSave}>
              {editor.currentName ? "保存联系人" : "创建联系人"}
            </button>
            <button className="button ghost" onClick={onReset}>
              重置表单
            </button>
            {editor.currentName ? (
              <button className="button danger" onClick={onDelete}>
                删除联系人
              </button>
            ) : null}
          </div>

          <p className="subtle">
            更新采用最终状态替换语义。若要移除某条链地址，直接把对应输入留空即可。
          </p>
        </div>
      </div>

      <div className="lookup-box">
        <h3>按精确地址反查</h3>
        <div className="lookup-row">
          <input
            placeholder="输入 CKB / Ethereum 地址"
            value={lookupAddress}
            onChange={(event) => onLookupAddressChange(event.target.value)}
          />
          <button className="button primary" onClick={onLookup}>
            查询
          </button>
        </div>

        {lookupResult ? (
          <div className="lookup-result">
            <strong>
              {lookupResult.matched ? "匹配成功" : "未匹配到联系人"}
              {lookupResult.chain ? ` · ${lookupResult.chain}` : ""}
            </strong>
            <span>{lookupResult.address}</span>
            {lookupResult.contacts.length > 0 ? (
              <div className="chip-row">
                {lookupResult.contacts.map((name) => (
                  <span key={name} className="chain-chip">
                    {name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="subtle">这个地址当前没有命中地址簿联系人。</p>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
