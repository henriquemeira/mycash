import { generateSnowflakeId } from "./snowflake";

export function newId(): string {
  return generateSnowflakeId().toString();
}
