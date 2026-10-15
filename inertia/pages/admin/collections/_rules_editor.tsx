import { Link } from '@adonisjs/inertia/react'
import { Plus, Trash2 } from 'lucide-react'
import { FormButton, FormInput, FormInputNumber, FormSelect } from '~/components/form'
import { IconButton } from '~/components/ui'
import { useDebouncedValue } from '~/hooks/use_debounced_value'
import { type FieldErrors } from '~/lib/http'
import { cn, field as fieldStyles } from '~/lib/styles'
import { formatPriceRange } from '../products/_format'
import { ruleFieldLabels, ruleOperatorLabels, ruleValuePlaceholders } from './_format'
import { useCollectionPreview } from './_hooks'
import {
  COLLECTION_RULE_FIELDS,
  CollectionMatchSchema,
  CollectionPreviewInputSchema,
  MAX_COLLECTION_RULES,
  NUMERIC_RULE_FIELDS,
  RULE_OPERATORS_BY_FIELD,
  VALUELESS_RULE_OPERATORS,
  type CollectionMatch,
  type CollectionRuleField,
  type CollectionRuleOperator,
  type CollectionSortOrder,
} from './_types'

export type RuleDraft = {
  key: string
  field: CollectionRuleField
  operator: CollectionRuleOperator
  value: string
}

let nextKey = 0

export function newRuleDraft(
  field: CollectionRuleField = 'tag',
  operator?: CollectionRuleOperator,
  value = ''
): RuleDraft {
  nextKey += 1
  return {
    key: `rule-${nextKey}`,
    field,
    operator: operator ?? RULE_OPERATORS_BY_FIELD[field][0],
    value,
  }
}

export function toRuleForms(drafts: RuleDraft[]) {
  return drafts.map(({ field, operator, value }) => ({
    field,
    operator,
    value: VALUELESS_RULE_OPERATORS.includes(operator) ? null : value.trim() || null,
  }))
}

type RulesEditorProps = {
  match: CollectionMatch
  onMatchChange: (match: CollectionMatch) => void
  rules: RuleDraft[]
  onRulesChange: (rules: RuleDraft[]) => void
  sortOrder: CollectionSortOrder
  errors: FieldErrors
  disabled?: boolean
}

const fieldOptions = COLLECTION_RULE_FIELDS.map((value) => ({
  value,
  label: ruleFieldLabels[value],
}))

export default function RulesEditor({
  match,
  onMatchChange,
  rules,
  onRulesChange,
  sortOrder,
  errors,
  disabled = false,
}: RulesEditorProps) {
  function update(key: string, patch: Partial<RuleDraft>) {
    onRulesChange(rules.map((rule) => (rule.key === key ? { ...rule, ...patch } : rule)))
  }

  function changeField(rule: RuleDraft, next: CollectionRuleField) {
    const operators = RULE_OPERATORS_BY_FIELD[next]
    const operator = operators.includes(rule.operator) ? rule.operator : operators[0]
    const keepValue =
      NUMERIC_RULE_FIELDS.includes(next) === NUMERIC_RULE_FIELDS.includes(rule.field)
    update(rule.key, { field: next, operator, value: keepValue ? rule.value : '' })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="sm:max-w-[280px]">
        <FormSelect
          name="match"
          label="Products must match"
          value={match}
          disabled={disabled}
          options={[
            { value: 'all', label: 'All conditions' },
            { value: 'any', label: 'Any condition' },
          ]}
          onChange={(event) => onMatchChange(CollectionMatchSchema.parse(event.target.value))}
          error={errors.match}
        />
      </div>

      <ol className="flex flex-col gap-3">
        {rules.map((rule, index) => {
          const operators = RULE_OPERATORS_BY_FIELD[rule.field]
          const needsValue = !VALUELESS_RULE_OPERATORS.includes(rule.operator)
          const isNumeric = NUMERIC_RULE_FIELDS.includes(rule.field)
          const valueName = `rules.${index}.value`
          return (
            <li
              key={rule.key}
              className="grid grid-cols-1 items-start gap-3 rounded-lg border border-line p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
            >
              <FormSelect
                name={`rules.${index}.field`}
                label="Field"
                hideLabel={index > 0}
                value={rule.field}
                disabled={disabled}
                options={fieldOptions}
                onChange={(event) => changeField(rule, event.target.value as CollectionRuleField)}
                error={errors[`rules.${index}.field`]}
              />
              <FormSelect
                name={`rules.${index}.operator`}
                label="Condition"
                hideLabel={index > 0}
                value={rule.operator}
                disabled={disabled}
                options={operators.map((value) => ({ value, label: ruleOperatorLabels[value] }))}
                onChange={(event) =>
                  update(rule.key, { operator: event.target.value as CollectionRuleOperator })
                }
                error={errors[`rules.${index}.operator`]}
              />
              {!needsValue ? (
                <div className="hidden sm:block" aria-hidden="true" />
              ) : isNumeric ? (
                <FormInputNumber
                  name={valueName}
                  label="Value"
                  hideLabel={index > 0}
                  placeholder={ruleValuePlaceholders[rule.field]}
                  value={rule.value === '' ? null : Number(rule.value)}
                  disabled={disabled}
                  onChange={(value) =>
                    update(rule.key, { value: value === null ? '' : String(value) })
                  }
                  error={errors[valueName]}
                />
              ) : (
                <FormInput
                  name={valueName}
                  label="Value"
                  hideLabel={index > 0}
                  autoComplete="off"
                  placeholder={ruleValuePlaceholders[rule.field]}
                  value={rule.value}
                  disabled={disabled}
                  onChange={(event) => update(rule.key, { value: event.target.value })}
                  error={errors[valueName]}
                />
              )}
              <div className={cn('flex justify-end', index === 0 && 'sm:pt-[26px]')}>
                <IconButton
                  label={`Remove condition ${index + 1}`}
                  disabled={disabled || rules.length <= 1}
                  onClick={() => onRulesChange(rules.filter((entry) => entry.key !== rule.key))}
                >
                  <Trash2 size={15} />
                </IconButton>
              </div>
            </li>
          )
        })}
      </ol>

      {errors.rules && <span className={fieldStyles.error}>{errors.rules}</span>}

      {!disabled && (
        <div>
          <FormButton
            type="button"
            variant="secondary"
            size="sm"
            disabled={rules.length >= MAX_COLLECTION_RULES}
            onClick={() => onRulesChange([...rules, newRuleDraft()])}
          >
            <Plus size={15} /> Add another condition
          </FormButton>
        </div>
      )}

      <RulesPreview match={match} rules={rules} sortOrder={sortOrder} />
    </div>
  )
}

function RulesPreview({
  match,
  rules,
  sortOrder,
}: {
  match: CollectionMatch
  rules: RuleDraft[]
  sortOrder: CollectionSortOrder
}) {
  const parsed = CollectionPreviewInputSchema.safeParse({
    match,
    sortOrder,
    rules: toRuleForms(rules),
  })
  const input = useDebouncedValue(parsed.success ? parsed.data : null, 400)
  const { data, isFetching, isError } = useCollectionPreview(input)

  return (
    <div
      className="rounded-lg border border-dashed border-line-2 bg-paper/60 p-4"
      aria-live="polite"
    >
      {!parsed.success ? (
        <p className="text-[13px] text-muted">
          Complete the conditions to preview matching products.
        </p>
      ) : isError ? (
        <p className="text-[13px] text-danger">Could not load the preview.</p>
      ) : !data ? (
        <p className="text-[13px] text-muted">Checking matching products…</p>
      ) : (
        <div className={cn('flex flex-col gap-2', isFetching && 'opacity-60')}>
          <p className="text-[13px] font-medium text-ink">
            {data.metadata.total} {data.metadata.total === 1 ? 'product matches' : 'products match'}
          </p>
          {data.data.length > 0 && (
            <ul className="flex flex-col divide-y divide-line">
              {data.data.map((product) => (
                <li
                  key={product.id}
                  className="flex min-w-0 items-center justify-between gap-3 py-1.5"
                >
                  <Link
                    route="admin.products.edit"
                    routeParams={{ id: product.id }}
                    className="min-w-0 truncate text-[13px] text-ink hover:underline"
                  >
                    {product.title}
                  </Link>
                  <span className="shrink-0 font-mono text-[12px] text-muted">
                    {formatPriceRange(product.priceMin, product.priceMax)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
