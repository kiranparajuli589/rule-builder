import countries from "@/domain/constants/countries.json";

import {
	ConditionDTO,
	ConditionField,
	ConditionOperator,
	FieldDefinition,
	JoinOperator,
	OperatorDefinition,
} from "./types.ts";

export default {
	generateId(): string {
		return "_" + Math.random().toString(36).substring(2, 9);
	},

	createEmptyCondition(includeJoinOperator: boolean = false): ConditionDTO {
		const condition: ConditionDTO = {
			id: this.generateId(),
			field: ConditionField.URI_PATH,
			operator: ConditionOperator.EQUALS,
			value: "",
			isGroup: false,
			conditions: [], // Keep for UI consistency
		};

		// Only add joinOperator if explicitly requested (for non-first conditions)
		if (includeJoinOperator) {
			condition.joinOperator = JoinOperator.AND;
		}

		return condition;
	},

	createGroup(
		conditions: ConditionDTO[] = [],
		includeJoinOperator: boolean = false
	): ConditionDTO {
		// Ensure all conditions have proper IDs
		const normalizedConditions =
			conditions.length > 0
				? conditions.map((c) => this.ensureConditionStructure(c))
				: [
						this.createEmptyCondition(false), // First condition in group has no joinOperator
						this.createEmptyCondition(true), // Second condition has joinOperator
					];

		const group: ConditionDTO = {
			id: this.generateId(),
			isGroup: true,
			conditions: normalizedConditions,
		};

		// Only add joinOperator if this group joins with a previous element
		if (includeJoinOperator) {
			group.joinOperator = JoinOperator.AND;
		}

		return group;
	},

	// Ensure condition has proper structure and ID
	ensureConditionStructure(condition: ConditionDTO): ConditionDTO {
		const normalized = { ...condition };

		if (!normalized.id) {
			normalized.id = this.generateId();
		}

		// Ensure conditions array exists for UI consistency
		if (!normalized.conditions) {
			normalized.conditions = [];
		}

		// For groups, recursively ensure structure
		if (normalized.isGroup && normalized.conditions.length > 0) {
			normalized.conditions = normalized.conditions.map((c) =>
				this.ensureConditionStructure(c)
			);
		}

		return normalized;
	},

	// Clean a condition for export (remove empty conditions array from regular conditions)
	cleanCondition(condition: ConditionDTO): ConditionDTO {
		const cleaned = {
			id: condition.id,
			...(!condition.isGroup && {
				field: condition.field,
				operator: condition.operator,
				value: condition.value,
			}),
			isGroup: condition.isGroup || false,
		} as ConditionDTO;

		// Add joinOperator only if it exists
		if (condition.joinOperator) {
			cleaned.joinOperator = condition.joinOperator;
		}

		// Only add conditions array for groups
		if (condition.isGroup && condition.conditions) {
			cleaned.conditions = condition.conditions.map((c) =>
				this.cleanCondition(c)
			);
		}
		// For regular conditions, don't include the conditions array in the export

		return cleaned;
	},

	// Normalize join operators in a conditions array
	normalizeJoinOperators(
		conditions: ConditionDTO[],
		defaultOperator: JoinOperator = JoinOperator.AND
	): ConditionDTO[] {
		return conditions.map((condition, index) => {
			const normalized = { ...condition };

			if (index === 0) {
				// First condition should never have joinOperator
				delete normalized.joinOperator;
			} else normalized.joinOperator ??= defaultOperator;

			// Recursively normalize nested conditions
			if (
				normalized.isGroup &&
				normalized.conditions &&
				normalized.conditions.length > 0
			) {
				normalized.conditions = this.normalizeJoinOperators(
					normalized.conditions,
					normalized.joinOperator ?? defaultOperator
				);
			}

			return normalized;
		});
	},

	getFields(): FieldDefinition[] {
		return [
			{
				label: "rule-builder-fields-uri-path",
				value: ConditionField.URI_PATH,
				description: "rule-builder-fields-uri-path-description",
				meta: {
					placeholder: "/api/v1/users",
					valueDescription: "rule-builder-fields-uri-path-hint",
				},
				validate: (value?: string) => {
					if (!value) return "validation-required";
					if (!value.startsWith("/"))
						return "rule-builder-validation-path-must-start-with-slash";
					if (!/^[a-zA-Z0-9/.\-_~%:;?&=#@]+$/.test(value)) {
						return "rule-builder-validation-path-invalid-chars";
					}
					if (value.length > 2048) {
						return "rule-builder-validation-path-too-long";
					}
					return undefined;
				},
			},
			{
				label: "rule-builder-fields-method",
				value: ConditionField.METHOD,
				description: "rule-builder-fields-method-description",
				meta: {
					type: "select",
					placeholder: "rule-builder-fields-method-placeholder",
					options: [
						{ label: "GET", value: "GET" },
						{ label: "POST", value: "POST" },
						{ label: "PUT", value: "PUT" },
						{ label: "DELETE", value: "DELETE" },
						{ label: "PATCH", value: "PATCH" },
						{ label: "OPTIONS", value: "OPTIONS" },
					],
				},
			},
			{
				label: "rule-builder-fields-host",
				value: ConditionField.HOST,
				description: "rule-builder-fields-host-description",
				meta: {
					placeholder: "example.com",
					valueDescription: "rule-builder-fields-host-hint",
				},
				validate: (value?: string) => {
					if (!value) return "validation-required";
					// Basic hostname validation
					const hostnameRegex =
						/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?(\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?)*$/;
					if (!hostnameRegex.test(value)) {
						return "rule-builder-validation-invalid-hostname";
					}
					return undefined;
				},
			},
			{
				label: "rule-builder-fields-user-agent",
				value: ConditionField.USER_AGENT,
				description: "rule-builder-fields-user-agent-description",
				meta: {
					placeholder: "Mozilla/5.0...",
				},
			},
			{
				label: "rule-builder-fields-country",
				value: ConditionField.COUNTRY,
				description: "rule-builder-fields-country-description",
				meta: {
					type: "select",
					placeholder: "rule-builder-fields-country-placeholder",
					options: this.getCountryOptions(),
				},
			},
			{
				label: "rule-builder-fields-status-code",
				value: ConditionField.STATUS_CODE,
				description: "rule-builder-fields-status-code-description",
				meta: {
					type: "number",
					placeholder: "200",
					min: 100,
					max: 599,
					step: 1,
					valueDescription: "rule-builder-fields-status-code-hint",
				},
				validate: (value) => {
					if (!value) return "validation-required";
					const num = parseInt(value, 10);
					if (isNaN(num))
						return "rule-builder-validation-must-be-number";
					if (num < 100 || num > 599)
						return "rule-builder-validation-status-code-range";
					return undefined;
				},
			},
		];
	},

	getOperators(): OperatorDefinition[] {
		return [
			{
				label: "rule-builder-operators-equals",
				value: ConditionOperator.EQUALS,
				description: "rule-builder-operators-equals-description",
			},
			{
				label: "rule-builder-operators-not-equals",
				value: ConditionOperator.NOT_EQUALS,
				description: "rule-builder-operators-not-equals-description",
			},
			{
				label: "rule-builder-operators-contains",
				value: ConditionOperator.CONTAINS,
				description: "rule-builder-operators-contains-description",
			},
			{
				label: "rule-builder-operators-starts-with",
				value: ConditionOperator.STARTS_WITH,
				description: "rule-builder-operators-starts-with-description",
			},
			{
				label: "rule-builder-operators-ends-with",
				value: ConditionOperator.ENDS_WITH,
				description: "rule-builder-operators-ends-with-description",
			},
		];
	},

	getJoinOperators() {
		return [
			{ label: "rule-builder-join-and", value: JoinOperator.AND },
			{ label: "rule-builder-join-or", value: JoinOperator.OR },
		];
	},

	getCountryOptions() {
		return countries.map((c) => ({
			value: c.code,
			label: c.name,
		}));
	},

	getFieldDefinition(field: ConditionField): FieldDefinition | undefined {
		return this.getFields().find((f) => f.value === field);
	},

	validateConditionValue(condition: ConditionDTO): string | undefined {
		if (!condition.field || condition.isGroup) return undefined;

		const fieldDef = this.getFieldDefinition(condition.field);
		if (!fieldDef) return undefined;

		if (fieldDef.validate) {
			return fieldDef.validate(condition.value);
		}

		if (!condition.value) {
			return "validation-required";
		}

		return undefined;
	},
};
