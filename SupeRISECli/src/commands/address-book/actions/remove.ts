import pc from "picocolors";
import { getConfig, updateConfig } from "@/utils/config";
import { promptText } from "@/utils/prompts";
import { parseContactName } from "../helps";

export async function removeAction(name?: string): Promise<void> {
  let contactName = name?.trim();
  if (!contactName) {
    contactName = await promptText("Contact name to remove");
  }
  const parsedName = parseContactName(contactName);

  const config = getConfig();
  const addressBook = config.addressBook || {};

  if (!(parsedName in addressBook)) {
    throw new Error(`Contact "${parsedName}" not found in address book.`);
  }

  const { [parsedName]: removed, ...newAddressBook } = addressBook;
  updateConfig({ addressBook: newAddressBook });

  console.log(pc.green(`Contact "${parsedName}" removed from address book.`));
  console.log(pc.dim(`Address: ${removed}`));
}
