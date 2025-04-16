import React from 'react';
import {
  Route,
  useRouteMatch,
  RouteComponentProps,
  Switch,
} from 'react-router-dom';
import AppCreator from '../AppsCreator';
import CookbookListing from '../AppListing';
import AppDetail from '../AppDetail';
import AppEdit from 'tapis-ui/components/apps/AppEdit';

const Router: React.FC = () => {
  const { path } = useRouteMatch();
  return (
    <Switch>
      <Route path={`${path}`} exact>
        <CookbookListing />
      </Route>

      <Route path={`${path}/new`} render={() => <AppCreator />}></Route>

      <Route
        path={`${path}/:appId/:appVersion`}
        exact
        render={({
          match: {
            params: { appVersion, appId },
          },
        }: RouteComponentProps<{
          appId: string;
          appVersion: string;
        }>) => <AppDetail appId={appId} appVersion={appVersion} />}
      />

      <Route
        path={`${path}/:appId/:appVersion/edit`}
        render={({
          match: {
            params: { appVersion, appId },
          },
        }: RouteComponentProps<{
          appId: string;
          appVersion: string;
        }>) => <AppEdit appId={appId} appVersion={appVersion} />}
      />
    </Switch>
  );
};

export default Router;
