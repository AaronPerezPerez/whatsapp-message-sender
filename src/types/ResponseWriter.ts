import * as fs from "fs";

export class ResponseWriter {
  static write(error?: Error) {
    // Write in the file response.txt the error.message
    fs.writeFileSync("response.txt", error ? error.message : "OK");
  }
}
