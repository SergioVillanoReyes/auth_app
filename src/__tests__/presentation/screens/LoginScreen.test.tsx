import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../../../presentation/context/AuthContext';
import { LoginScreen } from '../../../presentation/screens/LoginScreen';

jest.mock('../../../presentation/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('LoginScreen', () => {
  let authValue: ReturnType<typeof useAuth>;
  let login: jest.MockedFunction<ReturnType<typeof useAuth>['login']>;

  beforeEach(() => {
    login = jest.fn().mockResolvedValue(undefined);
    authValue = {
      state: { status: 'anonymous', isSubmitting: false },
      retryInitialization: jest.fn().mockResolvedValue(undefined),
      login,
      logout: jest.fn().mockResolvedValue(undefined),
    };
    jest.mocked(useAuth).mockReturnValue(authValue);
  });

  const findInput = (
    root: ReactTestRenderer.ReactTestInstance,
    label: string,
  ): ReactTestRenderer.ReactTestInstance =>
    root.findAllByType(TextInput).find(
      input => input.props.accessibilityLabel === label,
    )!;

  const enterCredentials = async (
    renderer: ReactTestRenderer.ReactTestRenderer,
    username: string,
    password: string,
  ): Promise<void> => {
    await ReactTestRenderer.act(async () => {
      findInput(renderer.root, 'Usuario').props.onChangeText(username);
      findInput(renderer.root, 'Contraseña').props.onChangeText(password);
    });
  };

  const pressLogin = (
    root: ReactTestRenderer.ReactTestInstance,
  ): void => {
    const button = root
      .findAllByType(TouchableOpacity)
      .find(candidate => candidate.findByType(Text).props.children === 'Entrar');
    if (!button) {
      throw new Error('Login button was not found');
    }
    button.props.onPress();
  };

  it('rejects blank credentials locally without calling login', async () => {
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<LoginScreen />);
    });
    await enterCredentials(renderer, '   ', '   ');

    await ReactTestRenderer.act(async () => {
      pressLogin(renderer.root);
    });

    expect(login).not.toHaveBeenCalled();
    expect(
      renderer.root.findAllByType(Text).some(
        node => node.props.children === 'Introduce usuario y contraseña.',
      ),
    ).toBe(true);
  });

  it('delegates valid credentials without modifying them', async () => {
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<LoginScreen />);
    });
    await enterCredentials(renderer, ' emilys ', ' password ');

    await ReactTestRenderer.act(async () => {
      pressLogin(renderer.root);
      await Promise.resolve();
    });

    expect(login).toHaveBeenCalledTimes(1);
    expect(login).toHaveBeenCalledWith({
      username: ' emilys ',
      password: ' password ',
    });
  });

  it('shows the authentication error and retains entered values', async () => {
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<LoginScreen />);
    });
    await enterCredentials(renderer, 'emilys', 'wrong-password');

    await ReactTestRenderer.act(async () => {
      pressLogin(renderer.root);
      await Promise.resolve();
    });

    authValue = {
      ...authValue,
      state: {
        status: 'anonymous',
        isSubmitting: false,
        loginError: 'El usuario o la contraseña no son correctos.',
      },
    };
    jest.mocked(useAuth).mockReturnValue(authValue);
    await ReactTestRenderer.act(async () => {
      renderer.update(<LoginScreen />);
    });

    expect(findInput(renderer.root, 'Usuario').props.value).toBe('emilys');
    expect(findInput(renderer.root, 'Contraseña').props.value).toBe(
      'wrong-password',
    );
    expect(
      renderer.root.findAllByType(Text).some(
        node =>
          node.props.children ===
          'El usuario o la contraseña no son correctos.',
      ),
    ).toBe(true);
  });

  it('disables fields and shows progress while submitting', async () => {
    let resolveLogin!: () => void;
    login.mockReturnValue(
      new Promise<void>(resolve => {
        resolveLogin = resolve;
      }),
    );
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<LoginScreen />);
    });
    await enterCredentials(renderer, 'emilys', 'password');

    await ReactTestRenderer.act(async () => {
      pressLogin(renderer.root);
    });

    authValue = {
      ...authValue,
      state: { status: 'anonymous', isSubmitting: true },
    };
    jest.mocked(useAuth).mockReturnValue(authValue);
    await ReactTestRenderer.act(async () => {
      renderer.update(<LoginScreen />);
    });

    expect(findInput(renderer.root, 'Usuario').props.editable).toBe(false);
    expect(findInput(renderer.root, 'Contraseña').props.editable).toBe(false);
    expect(renderer.root.findAllByType(ActivityIndicator)).toHaveLength(1);

    await ReactTestRenderer.act(async () => {
      resolveLogin();
      await Promise.resolve();
    });
  });
});
