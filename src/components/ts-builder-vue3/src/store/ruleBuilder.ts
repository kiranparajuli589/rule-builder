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
    },

    actions: {
        openDialog(
            options: {
                rule?: RuleDTO;
                extraInputsType?: ExtraInputs["type"];
                meta?: Record<string, any>;
            } = {}
        ) {
            this.rule = options.rule
                ? JSON.parse(JSON.stringify(options.rule))
                : RuleService.createEmptyRule();

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

        updateCondition(path: (string | number)[], value: any) {
            if (!this.rule) return;

            let target: any = this.rule;
            const keys = [...path];
            const lastKey = keys.pop();

            // Navigate to parent
            for (const key of keys) {
                target = target[key];
                if (!target) return;
            }

            // Update value
            if (lastKey !== undefined) {
                target[lastKey] = value;
            }
        },

        updateExtraInputs(data: Partial<ExtraInputs["data"]>) {
            this.extraInputs.data = {
                ...this.extraInputs.data,
                ...data,
            };
        },

        validateAndGetRule(): RuleDTO | null {
            if (!this.rule || !this.isValid) return null;

            return {
                ...this.rule,
                ...(this.extraInputs.data || {}),
            };
        },

        resetRule() {
            if (!this.rule) return;
            this.rule = RuleService.createEmptyRule();
            this.extraInputs.data = {};
        },
    },
});
