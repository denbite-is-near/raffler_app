import type { ButtonProps } from '@mui/material';
import { Button } from '@mui/material';
import { observer } from 'mobx-react-lite';

import { useRootStore } from 'providers/RootStoreContext';

type ConnectWalletButtonProps = {
  size?: ButtonProps['size'];
};

const ConnectWalletButton = (props: ConnectWalletButtonProps): JSX.Element => {
  const { authStore } = useRootStore();

  const handleLogin = async (): Promise<void> => {
    await authStore.login();
  };

  return (
    <Button
      variant="contained"
      size={props.size || 'medium'}
      disableRipple
      disableTouchRipple
      onClick={handleLogin}
      sx={{
        fontWeight: 600,
      }}
    >
      Connect Wallet
    </Button>
  );
};

const WrappedConnectWalletButton = observer(ConnectWalletButton);

export default WrappedConnectWalletButton;
