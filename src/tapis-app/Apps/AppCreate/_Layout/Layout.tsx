import { Button, Form, FormGroup, Input } from 'reactstrap';
import { SubmitWrapper } from 'tapis-ui/_wrappers';
import { useCreate } from 'tapis-hooks/apps';
import { useEffect, useRef, useState } from 'react';
import { Apps } from '@tapis/tapis-typescript';
import { focusManager } from 'react-query';
import {
  PageLayout,
  LayoutHeader,
  LayoutBody,
  Breadcrumbs,
} from 'tapis-ui/_common';
import { useHistory } from 'react-router-dom';
import styles from './AppCreate.module.css';

// Minimal required fields for app validation
const requiredAppFields = ['id', 'version', 'containerImage'];

export const Layout: React.FC = () => {
  const history = useHistory();
  const { isLoading, error, isSuccess, submit, data } = useCreate();

  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string>('');
  const [app, setApp] = useState<Apps.ReqPostApp | null>(null);
  const [appId, setAppId] = useState<string>('');
  const [containerImage, setContainerImage] = useState<string>('');
  const [inputMode, setInputMode] = useState<'file' | 'url' | null>(null);
  const [validationState, setValidationState] = useState<
    'valid' | 'invalid' | 'none'
  >('none');
  const [validationError, setValidationError] = useState<string>('');

  // Validate the app specification
  const validateAppSpec = (data: any): boolean => {
    // Check if it's a valid JSON object
    if (!data || typeof data !== 'object') {
      setValidationError('Invalid JSON format: Not a valid object');
      return false;
    }

    // Check for required fields
    const missingFields = requiredAppFields.filter((field) => !(field in data));
    if (missingFields.length > 0) {
      setValidationError(
        `Missing required fields: ${missingFields.join(', ')}`
      );
      return false;
    }

    // Additional validation can be added here for field formats, etc.
    return true;
  };

  useEffect(() => {
    const loadAppData = async () => {
      try {
        if (file) {
          const contents = await file.text();
          try {
            const data = JSON.parse(contents);

            if (validateAppSpec(data)) {
              setApp(data as Apps.ReqPostApp);
              setAppId(data.id || '');
              setContainerImage(data.containerImage || '');
              setValidationState('valid');
              setValidationError('');
            } else {
              setValidationState('invalid');
              setApp(null);
            }
          } catch (err) {
            setValidationState('invalid');
            setValidationError('Invalid JSON format: Unable to parse file');
            setApp(null);
          }
        } else if (url) {
          try {
            const response = await fetch(url);

            if (!response.ok) {
              throw new Error(
                `Failed to fetch: ${response.status} ${response.statusText}`
              );
            }

            const contentType = response.headers.get('content-type');

            // Try to parse as JSON even if content-type isn't application/json
            try {
              const data = await response.json();

              if (validateAppSpec(data)) {
                setApp(data as Apps.ReqPostApp);
                setAppId(data.id || '');
                setContainerImage(data.containerImage || '');
                setValidationState('valid');
                setValidationError('');
              } else {
                setValidationState('invalid');
                setApp(null);
              }
            } catch (parseError) {
              // If JSON parsing fails, then it's definitely not a valid JSON file
              setValidationState('invalid');
              setValidationError('URL does not contain valid JSON data');
              setApp(null);
              return;
            }
          } catch (err) {
            setValidationState('invalid');
            setValidationError(
              `Error fetching from URL: ${
                err instanceof Error ? err.message : String(err)
              }`
            );
            setApp(null);
          }
        } else {
          setValidationState('none');
          setValidationError('');
        }
      } catch (err) {
        setValidationState('invalid');
        setValidationError(
          `Unexpected error: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
        setApp(null);
      }
    };
    loadAppData();
  }, [file, url]);

  useEffect(() => {
    if (isSuccess) {
      focusManager.setFocused(true);
      // Navigate to the apps list page after successful creation
      setTimeout(() => {
        history.push('/apps');
      }, 1500);
    }
  }, [isSuccess, history]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      setUrl('');
      setInputMode('file');
      setValidationState('none');
      setValidationError('');
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    setFile(null);
    setInputMode('url');
    setValidationState('none');
    setValidationError('');
  };

  const handleFileClick = (
    e: React.MouseEvent<HTMLInputElement, MouseEvent>
  ) => {
    const element = e.target as HTMLInputElement;
    element.value = '';
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (app !== null) {
      const updatedApp = { ...app };

      // Only override the ID if the user has changed it
      if (appId && appId !== app.id) {
        updatedApp.id = appId;
      }

      // Override the container image if it has been changed
      if (containerImage && containerImage !== app.containerImage) {
        updatedApp.containerImage = containerImage;
      }

      submit(updatedApp);
    }
  };

  const inputFile = useRef(null);

  // Create breadcrumbs for the page
  const breadcrumbs = [
    { text: 'Apps', to: '/apps' },
    { text: 'Create New App', to: '/apps/create' },
  ];

  const header = (
    <LayoutHeader>
      <div className={styles.headerContent}>
        <h2>Create New Application</h2>
      </div>
    </LayoutHeader>
  );

  const body = (
    <LayoutBody>
      <div className={styles.container}>
        <div className={styles.formContainer}>
          <Form onSubmit={onSubmit}>
            {/* Step 1: Choose upload method */}
            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>1. Choose Upload Method</h2>

              <div className={styles.uploadOptions}>
                <div className={styles.uploadOption}>
                  <h3>Upload JSON File</h3>
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

                <div className={styles.divider}>OR</div>

                <div className={styles.uploadOption}>
                  <h3>Provide JSON URL</h3>
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

              {validationState === 'invalid' && (
                <div className={styles.validationError}>
                  <div className={styles.errorIcon}>!</div>
                  <div className={styles.errorMessage}>
                    {validationError || 'Invalid application specification'}
                  </div>
                </div>
              )}

              {validationState === 'valid' && (
                <div className={styles.validationSuccess}>
                  <div className={styles.successIcon}>✓</div>
                  <div className={styles.successMessage}>
                    Valid application specification detected
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Customize Application ID (Optional) */}
            <div
              className={`${styles.formSection} ${
                !app ? styles.disabledSection : ''
              }`}
            >
              <h2 className={styles.sectionTitle}>
                2. Customize Application ID{' '}
                <span className={styles.optionalBadge}>(Optional)</span>
              </h2>

              <FormGroup>
                <label htmlFor="appId" className={styles.label}>
                  Application ID
                </label>
                <Input
                  type="text"
                  name="appId"
                  id="appId"
                  placeholder="Override the Application ID (optional)"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  className={styles.input}
                  disabled={!app}
                />
                <small className={styles.helperText}>
                  {app ? (
                    <>
                      <span className={styles.detectedId}>
                        ID from file: <strong>{app?.id || ''}</strong>
                      </span>
                      {app?.id !== appId && appId && (
                        <span className={styles.overriddenId}>
                          {' '}
                          → You're overriding with: <strong>{appId}</strong>
                        </span>
                      )}
                    </>
                  ) : (
                    'Upload a valid application specification first'
                  )}
                </small>
              </FormGroup>
            </div>

            {/* Step 3: Customize Container Image (Optional) */}
            <div
              className={`${styles.formSection} ${
                !app ? styles.disabledSection : ''
              }`}
            >
              <h2 className={styles.sectionTitle}>
                3. Customize Container Image{' '}
                <span className={styles.optionalBadge}>(Optional)</span>
              </h2>

              <FormGroup>
                <label htmlFor="containerImage" className={styles.label}>
                  Container Image
                </label>
                <Input
                  type="text"
                  name="containerImage"
                  id="containerImage"
                  placeholder="Override the Container Image (optional)"
                  value={containerImage}
                  onChange={(e) => setContainerImage(e.target.value)}
                  className={styles.input}
                  disabled={!app}
                />
                <small className={styles.helperText}>
                  {app ? (
                    <>
                      <span className={styles.detectedId}>
                        Container image from file:{' '}
                        <strong>{app?.containerImage || ''}</strong>
                      </span>
                      {app?.containerImage !== containerImage &&
                        containerImage && (
                          <span className={styles.overriddenId}>
                            {' '}
                            → You're overriding with:{' '}
                            <strong>{containerImage}</strong>
                          </span>
                        )}
                    </>
                  ) : (
                    'Upload a valid application specification first'
                  )}
                </small>
              </FormGroup>
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
                  disabled={
                    isLoading ||
                    isSuccess ||
                    (!file && !url) ||
                    validationState !== 'valid'
                  }
                >
                  Create Application
                </Button>
              </SubmitWrapper>
            </div>
          </Form>
        </div>
      </div>
    </LayoutBody>
  );

  return <PageLayout top={header} left={body} />;
};

export default Layout;
