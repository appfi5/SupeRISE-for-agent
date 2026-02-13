import { Command } from "commander";
import { addAction } from "./actions/add.js";
import { listAction } from "./actions/list.js";
import { removeAction } from "./actions/remove.js";
import { updateAction } from "./actions/update.js";

export function registerAddressBookCommands(program: Command): void {
  const addressBook = program
    .command("address-book")
    .description("Address book management commands");

  addressBook
    .command("add")
    .argument("[name]", "Contact name")
    .argument("[address]", "CKB address")
    .description("Add a new contact to address book")
    .action(addAction);

  addressBook
    .command("list")
    .description("List all contacts in address book")
    .action(listAction);

  addressBook
    .command("remove")
    .argument("[name]", "Contact name to remove")
    .description("Remove a contact from address book")
    .action(removeAction);

  addressBook
    .command("update")
    .argument("[name]", "Contact name to update")
    .argument("[address]", "New CKB address")
    .description("Update a contact's address")
    .action(updateAction);
}
