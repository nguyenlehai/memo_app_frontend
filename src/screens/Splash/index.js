import {Heading, HStack, Spinner} from 'native-base';
import React from 'react';

const Page = () => {
  return (
    <HStack space={2} alignItems="center">
      <Spinner size="sm" />
      <Heading color="primary.500" fontSize="sm">
        Please wait...
      </Heading>
    </HStack>
  );
};

export default Page;
