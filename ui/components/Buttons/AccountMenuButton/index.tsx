import { useRef, useState } from 'react';

import {
  Avatar,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Tooltip,
  ListItemText,
} from '@mui/material';
import type { IconButtonProps } from '@mui/material';
import { observer } from 'mobx-react-lite';
import { Logout } from '@mui/icons-material';

import { useRootStore } from 'providers/RootStoreContext';
import nearProtocolLogoWhite from 'assets/images/near_logo.white.png';
import NearAmount from 'components/NearAmount';

type AccountMenuButtonProps = {
  size?: IconButtonProps['size'];
};

const AccountMenuButton = (props: AccountMenuButtonProps): JSX.Element => {
  const { authStore } = useRootStore();

  const anchorEl = useRef<HTMLButtonElement>(null);
  const [isOpenMenu, setIsOpenMenu] = useState(false);

  const openMenu = (): void => {
    setIsOpenMenu(true);
  };

  const closeMenu = (): void => {
    setIsOpenMenu(false);
  };

  const handleLogout = async (): Promise<void> => {
    await authStore.logout();

    closeMenu();
  };

  return (
    <>
      <IconButton
        ref={anchorEl}
        size={props.size || 'medium'}
        disableRipple
        disableTouchRipple
        onClick={openMenu}
        aria-controls={isOpenMenu ? 'account-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={isOpenMenu ? 'true' : undefined}
      >
        <Tooltip title="Open account">
          <Avatar
            alt="Near protocol"
            variant="circular"
            sx={{
              border: '2px white solid',
              backgroundColor: '#f8faf820',
              objectFit: 'cover',
            }}
            src={nearProtocolLogoWhite.src}
          >
            {/* <Image
              quality={30}
              layout="fill"
              objectFit="cover"
              src={nearProtocolLogoWhite}
            /> */}
          </Avatar>
        </Tooltip>
      </IconButton>
      <Menu
        anchorEl={anchorEl.current}
        id="account-menu"
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transitionDuration={400}
        open={isOpenMenu}
        onClose={closeMenu}
        PaperProps={{
          elevation: 0,
          sx: {
            width: 256,
            overflow: 'visible',
            padding: '0.5rem',
            backgroundColor: '#f9fbf9fa',
          },
        }}
      >
        <ListItemText
          primary={authStore.account?.id}
          primaryTypographyProps={{
            fontWeight: 600,
          }}
          secondary={
            <NearAmount
              amount={authStore.account?.balanceInNear || ''}
              mode="black"
              boxProps={{ marginLeft: 2 }}
            />
          }
        />
        <Divider />
        <MenuItem key="logout" onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </>
  );
};

const WrappedAccountMenuButton = observer(AccountMenuButton);

export default WrappedAccountMenuButton;
