import { useRootStore } from "providers/RootStoreContext";
import { useEffect, useState } from "react";

const withAuth = (Component: any) => {
  const AuthHOC = (props: any) => {
    const { authStore, eventStore } = useRootStore();

    const [isLoading, setLoading] = useState(true);

    const onAuthEffect = async (): Promise<void> => {
      setLoading(true);

      await authStore.updateAuthAccount();

      setLoading(false);
    };

    useEffect(() => {
      onAuthEffect();
    }, []);

    if (isLoading) return <></>;

    return <Component {...props} />;
  };

  if (Component.getInitialProps) {
    AuthHOC.getInitialProps = Component.getInitialProps;
  }

  return AuthHOC;
};

export default withAuth;
