import z from "zod";
import { MinHeap } from "mnemonist";
import dns from "node:dns/promises";
import type { MxRecord } from "node:dns";

export const MAX_RECORDS = 5;
export const MIN_RECORDS = 1;
export const NUM_RECORDS_DEFAULT = 3;

const NO_MX_RECORD_DNS_ERROR_CODES = new Set([
	"EBADNAME",
	"ENODATA",
	"ENOTFOUND",
]);
const NO_MX_RECORD_ERROR_MESSAGE =
	"Could not find any MX Records for this domain.";

export class MXRecordRetriever {
	private destinationDomain: string;
	private numRecordsToReturn: number;

	constructor(
		private mailTo: string,
		maxRecords: number = NUM_RECORDS_DEFAULT,
	) {
		this.validateEmail(this.mailTo);
		this.numRecordsToReturn = this.clampRecordsCap(maxRecords);
		this.destinationDomain = this.extractDomain(this.mailTo);
	}

	private clampRecordsCap(unverifiedRecordsCap: number): number {
		const normalizedCap = Number.isNaN(unverifiedRecordsCap)
			? NUM_RECORDS_DEFAULT
			: Math.floor(unverifiedRecordsCap);
		return Math.min(Math.max(MIN_RECORDS, normalizedCap), MAX_RECORDS);
	}

	private extractDomain(email: string): string {
		const atIndex = email.indexOf("@");
		return email.slice(atIndex + 1);
	}

	private validateEmail(email: string): void {
		z.email().parse(email);
	}

	async findMXRecords(): Promise<string[]> {
		let res: MxRecord[];
		try {
			res = await dns.resolveMx(this.destinationDomain);
		} catch (error) {
			if (
				error instanceof Error &&
				"code" in error &&
				NO_MX_RECORD_DNS_ERROR_CODES.has(String(error.code))
			) {
				throw new Error(NO_MX_RECORD_ERROR_MESSAGE, { cause: error });
			}

			throw error;
		}

		const highestPriorityRecords: string[] = [];
		const minHeap = MinHeap.from(
			res.filter((record) => record.exchange !== "." && record.exchange !== ""),
			(a: MxRecord, b: MxRecord) => a.priority - b.priority,
		);
		for (let i = 0; i < this.numRecordsToReturn; i++) {
			if (minHeap.size) highestPriorityRecords.push(minHeap.pop()!.exchange);
		}

		if (!highestPriorityRecords.length)
			throw new Error(NO_MX_RECORD_ERROR_MESSAGE);
		return highestPriorityRecords;
	}
}
