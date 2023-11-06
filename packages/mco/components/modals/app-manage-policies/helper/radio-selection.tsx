import * as React from 'react';
import {
  Alert,
  AlertVariant,
  Form,
  FormGroup,
  Radio,
  RadioProps,
} from '@patternfly/react-core';
import '../../../../style.scss';
import '../style.scss';

export const RadioSelection: React.FC<RadioSelectionProps> = (props) => {
  const {
    title,
    description,
    alertTitle,
    alertVariant,
    alertDescription,
    selected,
    radioProps,
  } = props;

  return (
    <>
      {alertTitle && (
        <Alert
          className="odf-alert"
          title={alertTitle}
          variant={alertVariant || AlertVariant.info}
          isInline
        >
          {alertDescription}
        </Alert>
      )}
      <Form>
        <FormGroup
          label={title}
          helperText={description}
          isHelperTextBeforeField
        >
          <div className="mco-manage-policies__radio-padding-left">
            {radioProps.map((radioProp, index) => (
              <Radio
                {...radioProp}
                key={`radio-selection-${index}`}
                isChecked={radioProp.value === selected}
                onChange={(_unused, event) => {
                  const selectedValue = event.target?.['value'];
                  radioProp.onChange(selectedValue);
                }}
              />
            ))}
          </div>
        </FormGroup>
      </Form>
    </>
  );
};

type Props = Omit<RadioProps, 'ref' | 'onChange'> & {
  onChange: (string) => void;
};

export type RadioSelectionProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  alertTitle?: React.ReactNode;
  alertDescription?: React.ReactNode;
  alertVariant?: AlertVariant;
  selected: string;
  className?: string;
  radioProps: Props[];
};
