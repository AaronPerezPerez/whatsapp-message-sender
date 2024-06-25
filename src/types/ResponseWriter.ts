import * as fs from "fs";
import { DomainError } from "../errors/DomainError.js";

export class ResponseWriter {
  static write(errors: DomainError[] = []) {
    const response = errors.reduce(
      (accumulated, error) =>
        accumulated + `${error.messageId}:${error.message}\n`,
      "",
    );
    fs.writeFileSync("response.txt", response);
  }
}
