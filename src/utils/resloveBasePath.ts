export const resolveBasePath = () => {
  console.log(window.location.href);
  let baseUrl = window.location.href.replace('/tapis-ui/', '').split('#')[0];
  baseUrl = window.location.href.replace('/cookbooks-ui/', '').split('#')[0];
  // .replace(/^https:\/\/ui\./, 'https://');
  // Direct request from local dev env to dev.develop
  if (/127\.0\.0\.1|localhost|0\.0\.0\.0/.test(baseUrl)) {
    return 'https://portals.tapis.io';
  }
  return 'https://portals.tapis.io';
};
