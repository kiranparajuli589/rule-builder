import {
	ConditionDTO,
	ConditionFields,
	ConditionOperators,
	JoinOperator,
} from "@/domain/components/rule-builder";
import CountryList from "@/domain/constants/countries.json";

export const generateId = () =>
	"_" + Math.random().toString(36).substring(2, 9);
const mustNotContainControlCharacters = (value: string) => {
	// eslint-disable-next-line no-control-regex
	if (/[\x00-\x1F\x7F]/.test(value)) {
		return "Value must  not contain control characters i.e new line, tab, etc.";
	}
};
const mustNotContainNonASCIICharacters = (value: string) => {
	if (/[^\x20-\x7E]/.test(value)) {
		return "Value must not contain non-ASCII characters";
	}
};

const ConditionService = {
	JOIN_OPERATORS: [
		{ label: "AND", value: JoinOperator.AND },
		{ label: "OR", value: JoinOperator.OR },
	],
	CONDITION_FIELDS: [
		{
			label: "METHOD",
			value: ConditionFields.METHOD,
			description:
				"HTTP methods, example: GET, POST, PATCH, PUT, DELETE, HEAD",
			options: ["GET", "POST", "PATCH", "PUT", "DELETE", "HEAD"],
		},
		{
			label: "PATH",
			value: ConditionFields.PATH,
			description:
				"Path of URL with query, example: /example?search=test",
			validate: (value: string) => {
				// 1. must start with a slash
				if (!value.startsWith("/")) {
					return "Path must start with a slash (/)";
				}
				// 2. must not contain spaces
				if (value.includes(" ")) {
					return "Path must not contain spaces";
				}
				// 3. must not contain control characters
				if (mustNotContainControlCharacters(value)) {
					return mustNotContainControlCharacters(value);
				}
				// 4. must not contain non-ASCII characters
				if (mustNotContainNonASCIICharacters(value)) {
					return mustNotContainNonASCIICharacters(value);
				}
				// 5. must not contain multiple slashes
				if (value.split("/").length > 2 && value.endsWith("/")) {
					return "Path must not end with a slash if it contains multiple segments";
				}
			},
		},
		{
			label: "AGENT",
			value: ConditionFields.AGENT,
			description:
				"User-Agent, example: Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:47.0) Gecko/20100101 Firefox/47.0",
			validate: (value: string) => {
				// 1. must not contain control characters
				if (mustNotContainNonASCIICharacters(value)) {
					return mustNotContainControlCharacters(value);
				}
				// 2. must not contain non-ASCII characters
				if (mustNotContainNonASCIICharacters(value)) {
					return mustNotContainNonASCIICharacters(value);
				}
			},
		},
		{
			label: "REFERER",
			value: ConditionFields.REFERER,
			description: "HTTP Referer header, example: https://example.com/",
			validate: (value: string) => {
				// 1. must not contain control characters
				if (mustNotContainNonASCIICharacters(value)) {
					return mustNotContainControlCharacters(value);
				}
				// 2. must not contain non-ASCII characters
				if (mustNotContainNonASCIICharacters(value)) {
					return mustNotContainNonASCIICharacters(value);
				}
				// 3. must be a valid URL format
				try {
					new URL(value);
				} catch {
					return "Referer must be a valid URL";
				}
			},
		},
		// country
		{
			label: "Country",
			value: ConditionFields.COUNTRY,
			description: "Country of the request, example: US, CA, GB",
			options: CountryList.map((country) => ({
				value: country.code,
				label: country.name,
			})),
		},
		// status
	],
	CONDITION_OPERATORS: [
		{
			label: "EQUAL",
			value: ConditionOperators.EQUAL,
			description: "equal, example: METHOD == GET",
		},
		{
			label: "NOT_EQUAL",
			value: ConditionOperators.NOT_EQUAL,
			description: "not equal, example: METHOD ~= GET",
		},
		{
			label: "REGULAR_MATCH",
			value: ConditionOperators.REGULAR_MATCH,
			description: "regular match, example: METHOD ~~ GET",
		},
		{
			label: "CASE_INSENSITIVE_REGULAR_MATCH",
			value: ConditionOperators.CASE_INSENSITIVE_REGULAR_MATCH,
			description:
				"case insensitive regular match, example: METHOD ~* GET",
		},
		{
			label: "REVERSE_RESULT",
			value: ConditionOperators.REVERSE_RESULT,
			description: "reverse the result, example: METHOD !~~ GET",
		},
	],
	createNewCondition: ({
		field = ConditionFields.PATH,
		operator = ConditionOperators.EQUAL,
		value = "",
		joinOperator = JoinOperator.AND,
		isGroup = false,
	} = {}) =>
		({
			id: generateId(),
			field,
			operator,
			value,
			joinOperator,
			isGroup,
		}) as ConditionDTO,
};

export default ConditionService;
