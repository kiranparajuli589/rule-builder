import { defineStore } from "pinia";

import {
    RuleDTO,
    RuleService,
    RuleValidationService,
    type ValidationError,
} from "@/domain/components/rule-builder";

export enum RuleBuilderExtraInputsType {
    STANDARD = "standard",
    PARAMETERS = "parameters",
    BLACKRULE = "blackrule",
}

interface ExtraInputs {
    type?: RuleBuilderExtraInputsType;
    data?: Record<string, any>;
}

interface RuleBuilderState {
    isOpen: boolean;
    rule: RuleDTO | null;
    extraInputs: ExtraInputs;
    meta: Record<string, any>;
}

export const useRuleBuilderStore = defineStore("ruleBuilder", {
    state: (): RuleBuilderState => ({
        isOpen: false,
        rule: null,
        extraInputs: {},
        meta: {},
    }),

    getters: {
        validationErrors(): ValidationError[] {
            if (!this.rule) return [];
            return RuleValidationService.validateRule(this.rule);
        },

        hasErrors(): boolean {
            return this.validationErrors.length > 0;
        },

        isValid(): boolean {
            return !this.hasErrors;
        },

        // Add getter for readable rule format
        readableRule(): string {
            const conditions = this.rule?.create_pattern?.conditions || [];
            if (!conditions.length) return "";
            return RuleService.formatReadableRule(conditions);
        },
    },

    actions: {
        openDialog(
            options: {
                rule?: RuleDTO;
                extraInputsType?: ExtraInputs["type"];
                meta?: Record<string, any>;
            } = {}
        ) {
            if (options.rule) {
                // Clone and ensure proper structure
                this.rule = JSON.parse(JSON.stringify(options.rule));

                // Normalize join operators to ensure correct structure
                if (this.rule?.create_pattern?.conditions) {
                    this.rule.create_pattern.conditions =
                        RuleService.normalizeJoinOperators(
                            this.rule.create_pattern.conditions
                        );
                }
            } else {
                // Create new rule with proper structure
                this.rule = RuleService.createEmptyRule();
            }

            this.extraInputs = {
                type: options.extraInputsType,
                data: {},
            };

            this.meta = options.meta || {};
            this.isOpen = true;
        },

        closeDialog() {
            this.isOpen = false;
            this.rule = null;
            this.extraInputs = {};
            this.meta = {};
        },

        updateRule(updates: Partial<RuleDTO>) {
            if (!this.rule) return;
            this.rule = { ...this.rule, ...updates };
        },

        validateAndGetRule(): RuleDTO | null {
            if (!this.rule || !this.isValid) return null;

            // Clean the rule before returning
            return RuleService.cleanRuleForExport({
                ...this.rule,
                ...(this.extraInputs.data || {}),
            });
        },

        resetRule() {
            if (!this.rule) return;
            this.rule = RuleService.createEmptyRule();
            this.extraInputs.data = {};
        },
    },
});
