const EPOCH = 1704067200000n;
let sequence = 0n;
let lastTimestamp = 0n;
const workerId = 1n;
const datacenterId = 1n;

export function generateSnowflakeId(): bigint {
  let timestamp = BigInt(Date.now()) - EPOCH;

  if (timestamp === lastTimestamp) {
    sequence = (sequence + 1n) & 4095n;
    if (sequence === 0n) {
      while (timestamp <= lastTimestamp) {
        timestamp = BigInt(Date.now()) - EPOCH;
      }
    }
  } else {
    sequence = 0n;
  }

  lastTimestamp = timestamp;

  return (
    (timestamp << 22n) |
    (datacenterId << 17n) |
    (workerId << 12n) |
    sequence
  );
}
