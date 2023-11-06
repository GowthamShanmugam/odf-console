import * as React from 'react';
import {
  TextContent,
  Text,
  TextVariants,
  List,
  ListItem,
} from '@patternfly/react-core';
import './reviewStepContent.scss';

export const ReviewStepContent: React.FC<ReviewStepContentProps> = ({
  children,
  title,
  component,
}) => (
  <div className="odf-review-step__content--margin-bottom">
    <TextContent className="odf-review-step__content--padding-bottom ">
      <Text component={component || TextVariants.h4}>{title}</Text>
    </TextContent>
    <List isPlain>{children}</List>
  </div>
);

export const ReviewStepContentItem: React.FC<ReviewStepContentItemProps> = ({
  children,
}) => <ListItem>{children}</ListItem>;

export type ReviewStepContentProps = {
  title: string;
  component?: TextVariants;
  children: React.ReactNode;
};

export type ReviewStepContentItemProps = {
  children: React.ReactNode;
};
