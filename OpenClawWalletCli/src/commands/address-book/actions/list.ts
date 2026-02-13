import pc from "picocolors";
import { getConfig } from "../../../utils/config.js";

export function listAction(): void {
  const config = getConfig();
  const addressBook = config.addressBook || {};

  const entries = Object.entries(addressBook);

  if (entries.length === 0) {
    console.log(pc.yellow("Address book is empty."));
    console.log(pc.dim("Use 'rise address-book add' to add contacts."));
    return;
  }

  const sortedEntries = entries.sort(([a], [b]) => a.localeCompare(b));

  console.log(pc.bold(`Address Book (${entries.length} contact${entries.length > 1 ? 's' : ''})`));
  console.log();

  sortedEntries.forEach(([name, address], index) => {
    const num = pc.dim(`${String(index + 1).padStart(2)}. `);
    const nameDisplay = pc.cyan(name);
    const addrDisplay = pc.dim(address);
    console.log(`${num}${nameDisplay}: ${addrDisplay}`);
  });
}
