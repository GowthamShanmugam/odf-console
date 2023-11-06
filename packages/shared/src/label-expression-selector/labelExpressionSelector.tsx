import * as React from 'react';
import { MatchExpression } from '@openshift-console/dynamic-plugin-sdk';
import { TFunction } from 'i18next';
import * as _ from 'lodash-es';
import {
  FormFieldGroupExpandable,
  Button,
  ButtonVariant,
  SelectOption,
  SelectVariant,
  Divider,
  Form,
  Grid,
  FormGroup,
  GridItem,
  Split,
  SplitItem,
  FormFieldGroupHeader,
} from '@patternfly/react-core';
import {
  TrashIcon,
  PlusCircleIcon,
  ExclamationCircleIcon,
} from '@patternfly/react-icons';
import { SingleSelectDropdown, MultiSelectDropdown } from '../dropdown';
import { useCustomTranslation } from '../useCustomTranslationHook';
import { AsyncLoader } from '../utils/AsyncLoader';
import './labelExpressionSelector.scss';

/**
 * Set up an AsyncComponent to wrap the label-expression-selector to allow on demand loading to reduce the
 * vendor footprint size.
 */
export const LazyLabelExpressionSelector = (
  props: LabelExpressionSelectorProps
) => (
  <AsyncLoader
    loader={() =>
      import('../label-expression-selector').then(
        (c) => c.LabelExpressionSelector
      )
    }
    {...props}
  />
);

const getValidatedProp = (error: boolean) => (error ? 'error' : 'default');

export const isKeyOnlyOperator = (operator: string) =>
  [Operator.EXISTS, Operator.DOES_NOT_EXISTS].includes(operator as Operator);

export const matchExpressionSummary = (
  t: TFunction,
  expression: MatchExpression,
  expandString?: string,
  isValidationEnabled?: boolean,
  hasError?: boolean
) => {
  let operator = t('unknown');
  switch (expression?.operator) {
    case Operator.IN:
      if (expression.values && expression.values.length > 1) {
        operator = t('equals any of');
      } else {
        operator = t('equals');
      }
      break;
    case Operator.NOT_IN:
      if (expression.values && expression.values.length > 1) {
        operator = t('does not equal any of');
      } else {
        operator = t('does not equal');
      }
      break;
    case Operator.EXISTS:
      operator = t('exists');
      break;
    case Operator.DOES_NOT_EXISTS:
      operator = t('does not exist');
      break;
  }

  if (isValidationEnabled && hasError) {
    return (
      <Split>
        <SplitItem>
          <ExclamationCircleIcon color="var(--pf-global--danger-color--100)" />
        </SplitItem>
        <SplitItem>
          <span className="pf-c-form__helper-text pf-m-error">
            &nbsp; {expandString || t('Expand to fix validation errors')}
          </span>
        </SplitItem>
      </Split>
    );
  }

  if (!expression?.key) {
    return expandString || t('Expand to enter expression');
  } else {
    return `${expression.key} ${operator} ${expression.values
      .map((value) => value)
      .join(', ')}`;
  }
};

const ExpressionElement: React.FC<ExpressionElementProps> = ({
  index,
  expression,
  options,
  isValidationEnabled,
  onUpdate,
}) => {
  const { t } = useCustomTranslation();
  const { key, operator, values } = expression;
  const isLabelValid = getValidatedProp(isValidationEnabled && !key);
  const isValuesValid = getValidatedProp(isValidationEnabled && !values.length);

  const onValuesChange = React.useCallback(
    (selectedValues: string[]) => {
      onUpdate(index, {
        ...expression,
        values: selectedValues,
      });
    },
    [index, expression, onUpdate]
  );

  const onOperatorChange = React.useCallback(
    (selectedOperator: Operator) => {
      onUpdate(index, {
        ...expression,
        operator: selectedOperator,
        values: isKeyOnlyOperator(selectedOperator) ? [] : values,
      });
    },
    [index, expression, values, onUpdate]
  );

  const onLabelChange = React.useCallback(
    (selectedKey: string) => {
      onUpdate(index, { ...expression, key: selectedKey, values: [] });
    },
    [index, expression, onUpdate]
  );

  return (
    <Grid hasGutter>
      <GridItem lg={4} sm={4}>
        <FormGroup
          label={t('Label')}
          isRequired
          hasNoPaddingTop
          validated={isLabelValid}
          helperTextInvalid={t('Required')}
        >
          <SingleSelectDropdown
            id="label-selection-dropdown"
            data-test-id={`label-selection-dropdown-${index}`}
            placeholderText={t('Select a label')}
            selectedKey={key}
            hasInlineFilter
            required
            validated={isLabelValid}
            selectOptions={Object.values(options).map((option, i) => (
              <SelectOption
                key={i}
                value={option.key.text}
                className="odf-label-expression-selector__selector--font-size"
              />
            ))}
            onChange={onLabelChange}
          />
        </FormGroup>
      </GridItem>
      <GridItem lg={4} sm={4}>
        <FormGroup
          label={t('Operator')}
          isRequired
          hasNoPaddingTop
          helperTextInvalid={t('Required')}
        >
          <SingleSelectDropdown
            id="operator-selection-dropdown"
            data-test-id={`operator-selection-dropdown-${index}`}
            selectedKey={operator}
            hasInlineFilter
            required
            selectOptions={Object.values(Operator).map((option, i) => (
              <SelectOption
                key={i}
                value={option}
                className="odf-label-expression-selector__selector--font-size"
              />
            ))}
            onChange={onOperatorChange}
          />
        </FormGroup>
      </GridItem>
      {!isKeyOnlyOperator(operator) && (
        <GridItem lg={4} sm={4}>
          <FormGroup
            label={t('Values')}
            isRequired
            hasNoPaddingTop
            validated={isValuesValid}
            helperTextInvalid={t('Required')}
          >
            <MultiSelectDropdown
              id="values-selection-dropdown"
              data-test-id={`values-selection-dropdown-${index}`}
              placeholderText={
                !!values?.length
                  ? t('{{count}} selected', { count: values.length })
                  : t('Select the values')
              }
              selections={values}
              variant={SelectVariant.checkbox}
              hasInlineFilter
              required
              validated={isValuesValid}
              selectOptions={Object.values(options?.[key]?.values || []).map(
                (option, i) => (
                  <SelectOption
                    key={i}
                    value={option.text}
                    className="odf-label-expression-selector__selector--font-size"
                  />
                )
              )}
              onChange={onValuesChange}
            />
          </FormGroup>
        </GridItem>
      )}
    </Grid>
  );
};

const ArrayInput: React.FC<ArrayInputProps> = ({
  index,
  expression,
  options,
  expandString,
  isValidationEnabled,
  onUpdate,
  onDelete,
}) => {
  const { t } = useCustomTranslation();
  const { key, operator, values } = expression;
  const expandSectionName = `expand-section-${index}`;

  return (
    <>
      <Divider />
      <Form>
        <FormFieldGroupExpandable
          key={expandSectionName}
          data-test={expandSectionName}
          toggleAriaLabel={expandSectionName}
          isExpanded
          header={
            <FormFieldGroupHeader
              titleText={{
                id: index.toString(),
                text: matchExpressionSummary(
                  t,
                  expression,
                  expandString,
                  isValidationEnabled,
                  !key || (isKeyOnlyOperator(operator) ? false : !values.length)
                ),
              }}
              actions={
                <Button
                  data-test={`delete-button-${index}`}
                  variant={ButtonVariant.plain}
                  onClick={() => onDelete(index)}
                >
                  <TrashIcon />
                </Button>
              }
            />
          }
        >
          <ExpressionElement
            index={index}
            expression={expression}
            options={options}
            isValidationEnabled={isValidationEnabled}
            onUpdate={onUpdate}
          />
        </FormFieldGroupExpandable>
      </Form>
      <Divider />
    </>
  );
};

export const LabelExpressionSelector: React.FC<LabelExpressionSelectorProps> =
  ({
    options,
    preSelected = [],
    expandString,
    addString,
    isValidationEnabled,
    onChange,
  }) => {
    const { t } = useCustomTranslation();
    const [expressions, setExpressions] =
      React.useState<MatchExpression[]>(preSelected);

    const updateExpression = React.useCallback(
      (index: number, expr: MatchExpression) => {
        const exprs = _.cloneDeep(expressions);
        exprs[index] = expr;
        setExpressions(exprs);
        onChange(exprs);
      },
      [expressions, onChange, setExpressions]
    );

    const appendExpression = React.useCallback(() => {
      updateExpression(expressions.length, {
        key: '',
        operator: Operator.IN,
        values: [],
      });
    }, [expressions, updateExpression]);

    const deleteExpression = React.useCallback(
      (index: number) => {
        let exps = _.cloneDeep(expressions);
        exps.splice(index, 1);
        setExpressions(exps);
        onChange(exps);
      },
      [expressions, onChange, setExpressions]
    );

    return (
      <>
        {expressions.map((expression, index) => (
          <ArrayInput
            index={index}
            key={index}
            expression={expression}
            options={options}
            expandString={expandString}
            isValidationEnabled={isValidationEnabled}
            onUpdate={updateExpression}
            onDelete={deleteExpression}
          />
        ))}
        <Button
          className="odf-label-expression-selector__button--margin-top"
          data-test="add-button"
          type="button"
          variant="link"
          onClick={appendExpression}
        >
          <PlusCircleIcon
            data-test-id="pairs-list__add-icon"
            className="co-icon-space-r"
          />
          {addString || t('Add label expression')}
        </Button>
      </>
    );
  };

export type OptionType = {
  [key in string]: {
    key: {
      text: string;
    };
    values: {
      text: string;
    }[];
  };
};

enum Operator {
  IN = 'In',
  NOT_IN = 'NotIn',
  EXISTS = 'Exists',
  DOES_NOT_EXISTS = 'DoesNotExist',
}

type ExpressionElementProps = {
  index: number;
  expression: MatchExpression;
  options: OptionType;
  isValidationEnabled?: boolean;
  onUpdate: (index: number, expression: MatchExpression) => void;
};

type ArrayInputProps = ExpressionElementProps & {
  expandString?: string;
  onDelete: (index: number) => void;
};

export type LabelExpressionSelectorProps = {
  options: OptionType;
  preSelected?: MatchExpression[];
  expandString?: string;
  addString?: string;
  isValidationEnabled?: boolean;
  onChange: (onChange: MatchExpression[]) => void;
};
