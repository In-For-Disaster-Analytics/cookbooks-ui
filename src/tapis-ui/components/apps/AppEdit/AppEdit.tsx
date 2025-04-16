import React, { useState } from 'react';
import { QueryWrapper, SubmitWrapper } from 'tapis-ui/_wrappers';
import { useDetail as useAppDetail } from 'tapis-hooks/apps';
import useCreate from 'tapis-hooks/apps/useCreate';
import usePatch from 'tapis-hooks/apps/usePatch';
import { Apps } from '@tapis/tapis-typescript';
import { LayoutHeader, Tabs } from 'tapis-ui/_common';
import styles from './AppEdit.module.scss';
import { ToolbarButton } from 'tapis-app/Apps/_components/Toolbar/Toolbar';
import { Form, FormGroup, Input, Label } from 'reactstrap';
import { useHistory } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import Markdown from 'react-markdown';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { useTapisConfig } from 'tapis-hooks';

type AppEditProps = {
  appId: string;
  appVersion: string;
};

type AppEditorProps = {
  app: Apps.TapisApp;
};

type AppDetailNotes = {
  helpText?: string;
  helpTextMarkdown?: string;
  helpTextHtml?: string;
  label?: string;
};

async function convertMarkdownToHtml(doc: string) {
  const file = await unified()
    .use(remarkParse) // Parse Markdown to MDAST
    .use(remarkRehype) // Transform MDAST to HAST
    .use(rehypeStringify) // Stringify HAST to HTML
    .process(doc);
  return String(file);
}

const AppEditor = ({ app }: AppEditorProps) => {
  const history = useHistory();
  const [containerImage, setContainerImage] = useState(
    app.containerImage || ''
  );
  const [newVersion, setNewVersion] = useState('');
  const [isReleaseNewVersion, setIsReleaseNewVersion] = useState(false);
  const {
    submit: submitCreate,
    isLoading: isLoadingCreate,
    error: errorCreate,
    isSuccess: isSuccessCreate,
  } = useCreate();
  const {
    submit: submitPatch,
    isLoading: isLoadingPatch,
    error: errorPatch,
    isSuccess: isSuccessPatch,
  } = usePatch();

  const notes = app.notes as AppDetailNotes;
  const initText = notes?.helpTextMarkdown || notes?.helpText || '';
  const [text, setText] = React.useState(initText);

  const { claims } = useTapisConfig();
  const isCurrentUser = (username: string) =>
    username === claims['tapis/username'];
  const hasPermissions: boolean =
    app.owner === undefined ? false : isCurrentUser(app.owner);

  // Handle container image update and optional new version creation
  const handleImageUpdate = async () => {
    if (isReleaseNewVersion) {
      // Create a new version with updated container image
      const updatedApp: Apps.ReqPostApp = {
        id: app.id as string,
        version: newVersion,
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
      submitCreate(updatedApp);
    } else {
      // Update existing version with the new container image
      submitPatch({
        appId: app.id as string,
        appVersion: app.version as string,
        reqPatchApp: {
          containerImage: containerImage,
        },
      });
    }
  };

  // Handle notes update
  const handleNotesUpdate = async () => {
    const helpTextHtml = await convertMarkdownToHtml(text);
    const helpText = helpTextHtml;
    const helpTextMarkdown = text;

    submitPatch({
      appId: app.id as string,
      appVersion: app.version as string,
      reqPatchApp: {
        description: helpTextHtml,
        notes: {
          ...notes,
          helpText,
          helpTextMarkdown,
          helpTextHtml,
        },
      },
    });
  };

  // When successful, redirect to the new app page
  React.useEffect(() => {
    if (isSuccessCreate || isSuccessPatch) {
      // Redirect to the app detail page
      const version = isReleaseNewVersion ? newVersion : app.version;
      history.push(`/apps/${app.id}/${version}`);
    }
  }, [
    isSuccessCreate,
    isSuccessPatch,
    app.id,
    app.version,
    newVersion,
    isReleaseNewVersion,
    history,
  ]);

  // Create tabs for the different sections
  const containerTab = (
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

      <div className={styles['button-container']}>
        <ToolbarButton
          text="Save Container Changes"
          icon="save"
          disabled={!hasPermissions}
          onClick={handleImageUpdate}
          aria-label="Save Container"
        />
      </div>
    </Form>
  );

  const editorTab = (
    <>
      <Editor
        height="70vh"
        defaultLanguage="markdown"
        options={{
          wordWrap: 'on',
          minimap: { enabled: false },
        }}
        defaultValue={text}
        onChange={(value) => value && setText(value)}
      />
      <div className={styles['button-container']}>
        <ToolbarButton
          text="Save Notes"
          icon="save"
          disabled={!hasPermissions}
          onClick={handleNotesUpdate}
          aria-label="Save Notes"
        />
      </div>
    </>
  );

  const previewTab = <Markdown>{text}</Markdown>;

  const tabs: { [name: string]: React.ReactNode } = {
    'Container Image': containerTab,
    'Notes Editor': editorTab,
    'Notes Preview': previewTab,
  };

  return (
    <div>
      <LayoutHeader type={'sub-header'}>
        {app.id} - {app.version}
        <SubmitWrapper
          isLoading={isLoadingCreate || isLoadingPatch}
          error={errorCreate || errorPatch}
          success={
            isSuccessCreate || isSuccessPatch ? `Successfully updated app` : ''
          }
          reverse={true}
        >
          <div className={styles['toolbar-wrapper']}>
            {!hasPermissions && (
              <ToolbarButton
                text="No Permissions"
                icon="save"
                disabled={true}
                onClick={() => {}}
                aria-label="No Permissions"
              />
            )}
          </div>
        </SubmitWrapper>
      </LayoutHeader>

      <Tabs tabs={tabs} />
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
