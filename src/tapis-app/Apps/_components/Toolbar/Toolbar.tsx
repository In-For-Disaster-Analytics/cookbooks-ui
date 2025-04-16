import React, { useState, useCallback } from 'react';
import { Button } from 'reactstrap';
import { Icon } from 'tapis-ui/_common';
import styles from './Toolbar.module.scss';
import DeleteModal from './DeleteModal';
import { Link, useLocation, useParams, useRouteMatch } from 'react-router-dom';
import { useDownload, usePermissions } from 'tapis-hooks/files';
import { useNotifications } from 'tapis-app/_components/Notifications';
import { useAppsSelect } from '../AppsContext';
import UploadModal from 'tapis-app/Apps/_components/Toolbar/UploadModal';
import ShareModal from './ShareModal';
import { useTapisConfig } from 'tapis-hooks';

type ToolbarButtonProps = {
  text: string;
  icon: string;
  onClick: () => void;
  disabled: boolean;
};

export type ToolbarModalProps = {
  toggle: () => void;
};

export const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  text,
  icon,
  onClick,
  disabled = true,
  ...rest
}) => {
  return (
    <div>
      <Button
        disabled={disabled}
        onClick={onClick}
        className={styles['toolbar-btn']}
        {...rest}
      >
        <Icon name={icon}></Icon>
        <span> {text}</span>
      </Button>
    </div>
  );
};

const Toolbar: React.FC = () => {
  const [modal, setModal] = useState<string | undefined>(undefined);
  const { selectedApps } = useAppsSelect();
  const { pathname } = useLocation();
  const [_, __, appId, appVersion] = pathname.split('/');
  const { claims } = useTapisConfig();
  const isCurrentUser = (username: string) =>
    username === claims['tapis/username'];
  const hasPermissions: boolean = selectedApps.every((app) =>
    app.owner === undefined ? false : isCurrentUser(app.owner)
  );
  const location = useLocation();
  const isCreatePage = location.pathname.endsWith('/create');

  const toggle = () => {
    setModal(undefined);
  };

  return (
    <div id="file-operation-toolbar">
      <div className={styles['toolbar-wrapper']}>
        {!isCreatePage ? (
          <Link to="/apps/create">
            <ToolbarButton
              text="Create"
              icon="add"
              disabled={false}
              onClick={function (): void {
                throw new Error('Function not implemented.');
              }}
            />
          </Link>
        ) : null}
        {!appId && !appVersion ? (
          <>
            <ToolbarButton
              text="Delete"
              icon="trash"
              disabled={selectedApps.length === 0 || !hasPermissions}
              onClick={() => setModal('delete')}
              aria-label="Delete"
            />
            <ToolbarButton
              text="Share"
              icon="globe"
              disabled={selectedApps.length === 0 || !hasPermissions}
              onClick={() => setModal('share')}
            />
          </>
        ) : null}
        {modal === 'delete' && <DeleteModal toggle={toggle} />}
        {modal === 'upload' && <UploadModal toggle={toggle} />}
        {modal === 'share' && <ShareModal toggle={toggle} />}
      </div>
    </div>
  );
};

export default Toolbar;
