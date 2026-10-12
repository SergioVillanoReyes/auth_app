import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Text } from 'react-native';
import App from '../App';
import { HomeScreen } from '../src/presentation/screens/HomeScreen';

test('renders the app', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});

test('shows the auth_app home screen', async () => {
  let renderer: ReturnType<typeof ReactTestRenderer.create> | undefined;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<HomeScreen />);
  });
  expect(
    renderer?.root.findAllByType(Text).some(node => node.props.children === 'auth_app')
  ).toBe(true);
});
