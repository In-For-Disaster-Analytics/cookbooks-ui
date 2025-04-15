import { Button, Form, FormGroup, Input } from 'reactstrap';
import { GenericModal } from 'tapis-ui/_common';
import { SubmitWrapper } from 'tapis-ui/_wrappers';
import { ToolbarModalProps } from '../Toolbar';
import styles from './UploadModal.module.scss';
import { useCreate } from 'tapis-hooks/apps';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Apps } from '@tapis/tapis-typescript';
import { focusManager } from 'react-query';

export enum FileOpEventStatus {
  loading = 'loading',
  progress = 'progress',
  error = 'error',
  success = 'success',
  none = 'none',
}

export type FileProgressState = {
  [name: string]: number;
};

type UploadModalProps = ToolbarModalProps & {
  maxFileSizeBytes?: number;
};

const UploadModal: React.FC<UploadModalProps> = ({ toggle }) => {
  const { isLoading, error, isSuccess, submit, data } = useCreate();

  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string>('');
  const [app, setApp] = useState<Apps.ReqPostApp | null>(null);
  const [appId, setAppId] = useState<string>('');
  const [inputMode, setInputMode] = useState<'file' | 'url' | null>(null);

  useEffect(() => {
    const loadAppData = async () => {
      if (file) {
        const contents = await file.text();
        const data = JSON.parse(contents) as Apps.ReqPostApp;
        setApp(data);
        setAppId(data.id || '');
      } else if (url) {
        try {
          const response = await fetch(url);
          const data = (await response.json()) as Apps.ReqPostApp;
          setApp(data);
          setAppId(data.id || '');
        } catch (err) {
          console.error('Error fetching from URL:', err);
        }
      }
    };
    loadAppData();
  }, [file, url]);

  useEffect(() => {
    if (isSuccess) {
      focusManager.setFocused(true);
    }
    setFile(null);
    setUrl('');
    setAppId('');
    setInputMode(null);
  }, [isSuccess]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      setUrl('');
      setInputMode('file');
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    setFile(null);
    setInputMode('url');
  };

  const handleFileClick = (
    e: React.MouseEvent<HTMLInputElement, MouseEvent>,
  ) => {
    const element = e.target as HTMLInputElement;
    element.value = '';
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (app !== null) {
      submit({ ...app, id: appId });
    }
  };

  const inputFile = useRef(null);
  return (
    <GenericModal
      toggle={toggle}
      title="Create New Application"
      body={
        <div className={styles.uploadModalBody}>
          <div className={styles.summary}>
            Create a new application by uploading a specification
          </div>

          <Form onSubmit={onSubmit}>
            {/* Step 1: Choose upload method */}
            <div className={styles.formSection}>
              <div className={styles.stepHeader}>
                <div className={styles.stepBadge}>1</div>
                <div className={styles.stepTitle}>Choose Upload Method</div>
              </div>

              <div className={styles.optionsContainer}>
                <div
                  className={`${styles.optionCard} ${inputMode === 'file' ? styles.selectedOption : ''}`}
                >
                  <div className={styles.optionHeader}>
                    <div className={styles.optionTitle}>Upload JSON File</div>
                  </div>
                  <Input
                    type="file"
                    name="file"
                    id="file"
                    ref={inputFile}
                    onChange={handleFileChange}
                    onClick={handleFileClick}
                    className={styles.input}
                    accept=".json,application/json"
                    disabled={inputMode === 'url'}
                  />
                  <small className={styles.helperText}>
                    Select a JSON file with the application specification.
                  </small>
                </div>

                <div className={styles.orCircle}>OR</div>

                <div
                  className={`${styles.optionCard} ${inputMode === 'url' ? styles.selectedOption : ''}`}
                >
                  <div className={styles.optionHeader}>
                    <div className={styles.optionTitle}>Provide JSON URL</div>
                  </div>
                  <Input
                    type="text"
                    name="url"
                    id="url"
                    placeholder="Paste a link to a JSON file"
                    value={url}
                    onChange={handleUrlChange}
                    className={styles.input}
                    disabled={inputMode === 'file'}
                  />
                  <small className={styles.helperText}>
                    Provide a direct link to a JSON file (e.g., from GitHub).
                  </small>
                </div>
              </div>
            </div>

            <div className={styles.divider}></div>

            {/* Step 2: Customize Application ID */}
            <div className={styles.formSection}>
              <div className={styles.stepHeader}>
                <div className={styles.stepBadge}>2</div>
                <div className={styles.stepTitle}>Set Application ID</div>
              </div>

              <div className={styles.idFormContainer}>
                <FormGroup>
                  <label htmlFor="appId" className={styles.label}>
                    Application ID
                  </label>
                  <Input
                    type="text"
                    name="appId"
                    id="appId"
                    placeholder="Enter or overwrite the Application ID"
                    value={appId}
                    onChange={(e) => setAppId(e.target.value)}
                    className={styles.input}
                    required
                  />
                  <small className={styles.helperText}>
                    {appId ? (
                      <>
                        Application ID detected or entered:{' '}
                        <strong>{appId}</strong>. You can modify it if needed.
                      </>
                    ) : (
                      'Enter a unique identifier for your application.'
                    )}
                  </small>
                </FormGroup>
              </div>
            </div>

            <div className={styles.submitContainer}>
              <SubmitWrapper
                isLoading={isLoading}
                error={error}
                success={isSuccess ? `Application created` : ''}
              >
                <Button
                  className={styles.submit}
                  color="primary"
                  block
                  disabled={isLoading || isSuccess || (!file && !url) || !appId}
                >
                  Create Application
                </Button>
              </SubmitWrapper>
            </div>
          </Form>
        </div>
      }
    />
  );
};

export default UploadModal;
