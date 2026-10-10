import { getDomainWithoutSuffix } from "tldts";
import { UrlToDomainConverter } from "../UrlToDomainConverter";
import {
	DomainValidatorConfig,
	UnverifiedDomainData,
	VerifiedDomainData,
} from "./CompanyDomainValidator.types";
import { TRUSTED_PAGE_PATHS } from "./trustedPagePaths";
import { URL } from "node:url";

const DEFAULT_DOMAIN_VALIDATOR_CONFIG = {
	substringMatchPassThreshold: 50,
	overallPassThreshold: 65,
};

const MIN_ALLOWABLE_DOMAIN_LENGTH = 3;
export const SUBSTRING_MATCH_CONFIDENCE_INCREASE = 25;
const PERFECT_OVERLAP = 100;
export const FOUND_ON_COMPANY_PAGE_MIN_SCORE = 15;

export class CompanyDomainValidator {
	constructor(
		private unverifiedDomainData: UnverifiedDomainData,
		private companyUrl: string,
		private urlToDomainConverter: UrlToDomainConverter,
		private domainValidatorConfig: DomainValidatorConfig = DEFAULT_DOMAIN_VALIDATOR_CONFIG,
	) {}

	validateDomain(): VerifiedDomainData {
		let confidence = 0;
		confidence = this.validateDomainSource(confidence);
		confidence = this.validateSubstringMatch(confidence);

		return {
			confidence: confidence,
			pass: confidence >= this.domainValidatorConfig.overallPassThreshold,
			domain: this.unverifiedDomainData.domain,
		};
	}

	private updateConfidence(confidence: number, amount: number): number {
		return Math.min(Math.max(0, confidence + amount), 100);
	}

	private validateDomainSource(confidence: number): number {
		const normalizedSourceUrl = this.urlToDomainConverter.convert(
			this.unverifiedDomainData.source,
		);
		const normalizedCompanyUrl = this.urlToDomainConverter.convert(
			this.companyUrl,
		);

		let addedConfidence = 0;
		if (normalizedCompanyUrl === normalizedSourceUrl)
			addedConfidence += this.getUrlConfidenceScore(
				this.unverifiedDomainData.source,
			);

		return this.updateConfidence(confidence, addedConfidence);
	}

	private getUrlConfidenceScore(url: string) {
		const { pathname } = new URL(url);

		const segments = pathname.toLowerCase().split("/").filter(Boolean);

		return Math.max(
			FOUND_ON_COMPANY_PAGE_MIN_SCORE,
			...TRUSTED_PAGE_PATHS.filter(({ path }) => segments.includes(path)).map(
				({ weight }) => weight,
			),
		);
	}

	private validateSubstringMatch(confidence: number): number {
		const companyUrlSLD = this.extractSecondLevelDomain(
			this.urlToDomainConverter.convert(this.companyUrl),
		);
		const unverifiedSLD = this.extractSecondLevelDomain(
			this.unverifiedDomainData.domain,
		);

		const shorterStr =
			companyUrlSLD.length > unverifiedSLD.length
				? unverifiedSLD
				: companyUrlSLD;
		const longerStr =
			companyUrlSLD.length > unverifiedSLD.length
				? companyUrlSLD
				: unverifiedSLD;
		if (shorterStr.length < MIN_ALLOWABLE_DOMAIN_LENGTH) {
			return shorterStr === longerStr
				? this.updateConfidence(confidence, PERFECT_OVERLAP)
				: confidence;
		}

		const overlapPercentage = this.findOverlapPercentage(shorterStr, longerStr);

		if (overlapPercentage === PERFECT_OVERLAP)
			return this.updateConfidence(confidence, 100);
		else if (
			overlapPercentage >=
			this.domainValidatorConfig.substringMatchPassThreshold
		)
			return this.updateConfidence(
				confidence,
				SUBSTRING_MATCH_CONFIDENCE_INCREASE,
			);
		else return confidence;
	}

	private findOverlapPercentage(shorterStr: string, longerStr: string): number {
		const cache: Record<string, number> = {};
		let maxOverlap = 0;

		const dfs = (shortCursor: number, longCursor: number): number => {
			if (shortCursor === shorterStr.length || longCursor === longerStr.length)
				return 0;

			const key = `${shortCursor}-${longCursor}`;
			if (key in cache) return cache[key]!;

			let curOverlap = 0;

			if (shorterStr[shortCursor] === longerStr[longCursor])
				curOverlap = 1 + dfs(shortCursor + 1, longCursor + 1);

			maxOverlap = Math.max(maxOverlap, curOverlap);
			cache[key] = curOverlap;

			return curOverlap;
		};

		for (let shortCursor = 0; shortCursor < shorterStr.length; shortCursor++) {
			for (let longCursor = 0; longCursor < longerStr.length; longCursor++) {
				dfs(shortCursor, longCursor);
			}
		}

		return (maxOverlap / longerStr.length) * 100;
	}

	private extractSecondLevelDomain(domain: string): string {
		const parsedSLD = getDomainWithoutSuffix(domain);
		if (!parsedSLD) throw new Error("Enter a valid domain name");

		return parsedSLD;
	}
}
