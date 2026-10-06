interface EmailGeneratorConfig {
	firstName: string,
	lastName: string,
	companyUrl: string
} 

class EmailGenerator{
	constructor(generatorConfig: EmailGeneratorConfig){

	}

	//1). check cache if exists, if so, add most likely patterns and domains to list

	//2). check domain name of literal url in MX, add to candidate domain if exists

	//3). Scrape bounded website pages looking for published emails.
	//    Extract both domains and patterns from found emails.

	//4). check domain name of found email domains in MX, and if none are a match use LOGO.dev then check mx of it, error if all fails
	
	//5). check possibility of catch-all, dramatically reducing confidence if so, then keeping top 3 most likely domain)

	//6). sort whitelisted email patterns by examples found in scrape, and conserve top 5

	//7). from most likely to least liekly of whitelisted pattern check if SMTP handshake is possible (5 * 3 = 15 candidates)

	//8). return most liekly email with confidence score

	//9). Update cache accordingly
}