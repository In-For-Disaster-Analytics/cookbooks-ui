import React, { useState } from 'react';
import { QueryWrapper, SubmitWrapper } from 'tapis-ui/_wrappers';
import { useDetail as useAppDetail } from 'tapis-hooks/apps';
import useCreate from 'tapis-hooks/apps/useCreate';
import { Apps } from '@tapis/tapis-typescript';
import { LayoutHeader } from 'tapis-ui/_common';
import styles from './AppEdit.module.scss';
import { ToolbarButton } from 'tapis-app/Apps/_components/Toolbar/Toolbar';
import { Form, FormGroup, Input, Label } from 'reactstrap';
import { useHistory } from 'react-router-dom';

type AppEditProps = {
  appId: string;
  appVersion: string;
};

type AppEditorProps = {
  app: Apps.TapisApp;
};

const AppEditor = ({ app }: AppEditorProps) => {
  const history = useHistory();
  const [containerImage, setContainerImage] = useState(
    app.containerImage || ''
  );
  const [newVersion, setNewVersion] = useState('');
  const [isReleaseNewVersion, setIsReleaseNewVersion] = useState(false);
  const { submit, isLoading, error, isSuccess, reset } = useCreate();

  const handleSubmit = async () => {
    // Create a copy of the app with updated fields and ensure required properties are present
    const updatedApp: Apps.ReqPostApp = {
      id: app.id as string,
      version: isReleaseNewVersion ? newVersion : (app.version as string),
      containerImage: containerImage,
      // Include other required fields
      description: app.description || '',
      runtime: app.runtime as Apps.RuntimeEnum,
      runtimeVersion: app.runtimeVersion || '',
      runtimeOptions: app.runtimeOptions || [],
      jobType: app.jobType as Apps.JobTypeEnum,
      maxJobs: app.maxJobs || 0,
      maxJobsPerUser: app.maxJobsPerUser || 0,
      strictFileInputs: app.strictFileInputs || false,
      // Copy any other optional properties that are present
      ...(app.jobAttributes && { jobAttributes: app.jobAttributes }),
      ...(app.notes && { notes: app.notes }),
    };

    // Submit the app
    submit(updatedApp);
  };

  // When successful, redirect to the new app page
  React.useEffect(() => {
    if (isSuccess) {
      // Redirect to the app detail page
      const version = isReleaseNewVersion ? newVersion : app.version;
      history.push(`/apps/${app.id}/${version}`);
    }
  }, [
    isSuccess,
    app.id,
    app.version,
    newVersion,
    isReleaseNewVersion,
    history,
  ]);

  return (
    <div>
      <LayoutHeader type={'sub-header'}>
        {app.id} - {app.version}
        <SubmitWrapper
          isLoading={isLoading}
          error={error}
          success={isSuccess ? `Successfully updated app` : ''}
          reverse={true}
        >
          <div className={styles['toolbar-wrapper']}>
            <ToolbarButton
              text="Save"
              icon="save"
              disabled={false}
              onClick={handleSubmit}
              aria-label="Save"
            />
          </div>
        </SubmitWrapper>
      </LayoutHeader>

      <Form className={styles['form']}>
        <FormGroup>
          <Label for="containerImage">Container Image</Label>
          <Input
            type="text"
            id="containerImage"
            value={containerImage}
            onChange={(e) => setContainerImage(e.target.value)}
            placeholder="e.g. library://user/collection/image:tag"
          />
          <div className={styles['help-text']}>
            The container image to use for this app (Docker or Singularity)
          </div>
        </FormGroup>

        <FormGroup check className={styles['checkbox-group']}>
          <Label check>
            <Input
              type="checkbox"
              checked={isReleaseNewVersion}
              onChange={() => setIsReleaseNewVersion(!isReleaseNewVersion)}
            />{' '}
            Release as a new version
          </Label>
        </FormGroup>

        {isReleaseNewVersion && (
          <FormGroup>
            <Label for="newVersion">New Version</Label>
            <Input
              type="text"
              id="newVersion"
              value={newVersion}
              onChange={(e) => setNewVersion(e.target.value)}
              placeholder="e.g. 1.0.1"
              required
            />
            <div className={styles['help-text']}>
              Version string for the new app version (e.g. 1.0.1, 2.0.0)
            </div>
          </FormGroup>
        )}
      </Form>
    </div>
  );
};

const AppEdit: React.FC<AppEditProps> = ({ appId, appVersion }) => {
  const { data, isLoading, error } = useAppDetail({ appId, appVersion });
  const app = data?.result;
  return (
    <QueryWrapper isLoading={isLoading} error={error}>
      {app && app.id !== undefined && app.version !== undefined ? (
        <AppEditor app={app} />
      ) : (
        'App not found'
      )}
    </QueryWrapper>
  );
};

export default AppEdit;
