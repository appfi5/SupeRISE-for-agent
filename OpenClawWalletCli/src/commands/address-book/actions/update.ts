import pc from "picocolors";
import { getConfig, updateConfig } from "../../../utils/config.js";
import { promptText } from "../../../utils/prompts.js";
import {
  parseContactName,
  validateAndNormalizeAddress,
} from "../helps.js";

export async function updateAction(name?: string, address?: string): Promise<void> {
  let contactName = name?.trim();
  if (!contactName) {
    contactName = await promptText("Contact name to update");
  }
  const parsedName = parseContactName(contactName);

  const config = getConfig();
  const addressBook = config.addressBook || {};

  if (!(parsedName in addressBook)) {
    throw new Error(`Contact "${parsedName}" not found in address book. Use 'add' command to create it.`);
  }

  let newAddress = address?.trim();
  if (!newAddress) {
    newAddress = await promptText("New CKB address");
  }
  const validatedAddress = validateAndNormalizeAddress(newAddress);

  const oldAddress = addressBook[parsedName];
  updateConfig({
    addressBook: {
      ...addressBook,
      [parsedName]: validatedAddress,
    },
  });

  console.log(pc.green(`Contact "${parsedName}" updated.`));
  console.log(pc.dim(`Old address: ${oldAddress}`));
  console.log(pc.dim(`New address: ${validatedAddress}`));
}
