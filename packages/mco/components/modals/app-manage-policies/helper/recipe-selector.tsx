import * as React from 'react';
import { getValidatedProp } from '@odf/mco/utils';
import { SingleSelectDropdown } from '@odf/shared/dropdown';
import { useCustomTranslation } from '@odf/shared/useCustomTranslationHook';
import {
  SelectOption,
  Form,
  FormGroup,
  CodeBlock,
  CodeBlockCode,
  Button,
  ButtonVariant,
} from '@patternfly/react-core';
import {
  ManagePolicyStateAction,
  ManagePolicyStateType,
  ModalViewContext,
  RecipeInfoType,
} from '../utils/reducer';
import '../style.scss';

const code = `apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: appset1-local-cluster
  namespace: openshift-gitops
  labels:
    velero.io/exclude-from-backup: 'true'
spec:
  destination:
    namespace: appset1
    server: 'https://api.drcluster2-rdrnov-7.devcluster.openshift.com:6443'
  project: default
  source:
    path: busybox-odr
    repoURL: 'https://github.com/RamenDR/ocm-ramen-samples'
    targetRevision: main
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
      - PruneLast=true`;

const recipeOption = ['app-recipe-1', 'app-recipe-2'];

export const RecipeSelector: React.FC<RecipeSelectorProps> = ({
  workLoadNamespace,
  isValidationEnabled,
  recipeInfo,
  dispatch,
}) => {
  const { t } = useCustomTranslation();
  const [recipe, selectRecipe] = React.useState(recipeInfo?.name);
  const [isHideCodeBlock, setIsHideCodeBlock] = React.useState(true);

  const isVaildRecipe = getValidatedProp(isValidationEnabled && !recipe);
  const onChange = (selected: string) => {
    selectRecipe(selected);
    dispatch({
      type: ManagePolicyStateType.SET_RECIPE_INFO,
      context: ModalViewContext.ASSIGN_POLICY_VIEW,
      payload: {
        name: selected,
        namespace: workLoadNamespace,
      },
    });
  };

  return (
    <Form>
      <FormGroup
        className="mco-manage-policies__recipe--dropdown-wide"
        label={t('Recipe')}
        isRequired
        validated={isVaildRecipe}
        helperTextInvalid={t('Required')}
      >
        <SingleSelectDropdown
          id="recipe-selection-dropdown"
          data-test-id={'recipe-selection-dropdown-'}
          placeholderText={t('Select a recipe')}
          selectedKey={recipe}
          required
          validated={isVaildRecipe}
          selectOptions={Object.values(recipeOption).map((option, i) => (
            <SelectOption
              className="odf-label-expression-selector__selector--font-size"
              key={i}
              value={option}
            />
          ))}
          onChange={onChange}
        />
      </FormGroup>
      {!!recipe && (
        <FormGroup>
          {!isHideCodeBlock && (
            <CodeBlock>
              <CodeBlockCode>{code}</CodeBlockCode>
            </CodeBlock>
          )}
          <Button
            className="pf-m-link--align-left"
            variant={ButtonVariant.link}
            onClick={() => setIsHideCodeBlock(!isHideCodeBlock)}
          >
            {!isHideCodeBlock
              ? t('Hide recipe details')
              : t('Show recipe details')}
          </Button>
        </FormGroup>
      )}
    </Form>
  );
};

type RecipeSelectorProps = {
  workLoadNamespace: string;
  recipeInfo: RecipeInfoType;
  isValidationEnabled: boolean;
  dispatch: React.Dispatch<ManagePolicyStateAction>;
};
