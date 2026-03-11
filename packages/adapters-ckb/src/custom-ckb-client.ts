import {
  ClientJsonRpc,
  KnownScript,
  ScriptInfo,
  type ScriptInfoLike,
} from "@ckb-ccc/core";
import { CkbSplitEndpointTransport } from "./split-endpoint-transport";

export type CustomCkbClientConfig = {
  rpcUrl: string;
  indexerUrl: string;
  addressPrefix: string;
  scripts: Record<string, ScriptInfoLike>;
};

export class CustomCkbClient extends ClientJsonRpc {
  private readonly scripts: Record<string, ScriptInfoLike>;
  private readonly prefix: string;

  constructor(config: CustomCkbClientConfig) {
    super(config.rpcUrl, {
      transport: new CkbSplitEndpointTransport(config.rpcUrl, config.indexerUrl),
    });
    this.prefix = config.addressPrefix;
    this.scripts = config.scripts;
  }

  get addressPrefix(): string {
    return this.prefix;
  }

  async getKnownScript(script: KnownScript): Promise<ScriptInfo> {
    const found = this.scripts[script];
    if (!found) {
      throw new Error(
        `No script information was found for ${script} on ${this.addressPrefix}`,
      );
    }

    return ScriptInfo.from(found);
  }
}
