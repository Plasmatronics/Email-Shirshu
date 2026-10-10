export interface UnverifiedDomainData {
	source: string;
	domain: string;
}

export interface VerifiedDomainData {
	confidence: number;
	domain: string;
	pass: boolean;
}

export interface DomainValidatorConfig {
	substringMatchPassThreshold: number;
	overallPassThreshold: number;
}
