import React from 'react';
import { useRouteMatch, useLocation } from 'react-router-dom';
import { useList } from 'tapis-hooks/apps';
import { Apps } from '@tapis/tapis-typescript';
import { Navbar, NavItem } from 'tapis-ui/_wrappers/Navbar';
import { QueryWrapper } from 'tapis-ui/_wrappers';
import { Nav } from 'reactstrap';

const AppsNav: React.FC = () => {
  const { data, isLoading, error } = useList(
    {},
    { refetchOnWindowFocus: false }
  );
  const { url } = useRouteMatch();
  const location = useLocation();
  const appList: Array<Apps.TapisApp> = data?.result ?? [];

  // Check if we're on the create page
  const isCreatePage = location.pathname.endsWith('/create');

  return (
    <QueryWrapper isLoading={isLoading} error={error}>
      <Navbar>
        <NavItem to={`${url}/new`} icon="upload">
          Quick Upload
        </NavItem>
        {!isCreatePage && (
          <NavItem to={`${url}/create`} icon="add">
            Create App
          </NavItem>
        )}
        {appList.length ? (
          appList.map((app) => (
            <NavItem
              to={`${url}/${app.id}/${app.version}`}
              icon="applications"
              key={app.id}
            >
              {`${app.id} v${app.version}`}
            </NavItem>
          ))
        ) : (
          <i>No apps found</i>
        )}
      </Navbar>
    </QueryWrapper>
  );
};

export default AppsNav;
