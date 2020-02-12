import AcquiaHttpHmac from 'http-hmac-javascript';
import CryptoJS from 'crypto-js';

// Modification of sign method of http-hmac-javascript
AcquiaHttpHmac.prototype.getHeaders = function({
  method,
  path,
  signed_headers = {},
  content_type = this.config.default_content_type,
  body = '',
}) {
  //stringify body
  if (body) {
    body = JSON.stringify(body);
  }
  // Validate input. First 2 parameters are mandatory.
  if (this.SUPPORTED_METHODS.indexOf(method) < 0) {
    throw new Error(
      `The method must be "${this.SUPPORTED_METHODS.join(
        '" or "'
      )}". "${method}" is not supported.`
    );
  }
  if (!path) {
    throw new Error('The end point path must not be empty.');
  }

  /**
   * Convert an object of parameters to a string.
   *
   * @param {object} parameters
   *   Header parameters in key: value pair.
   * @param value_prefix
   *   The parameter value's prefix decoration.
   * @param value_suffix
   *   The parameter value's suffix decoration.
   * @param glue
   *   When join(), use this string as the glue.
   * @param encode
   *   When true, encode the parameter's value; otherwise don't encode.
   * @returns {string}
   */
  let parametersToString = (
    parameters,
    value_prefix = '=',
    value_suffix = '',
    glue = '&',
    encode = true
  ) => {
    let parameter_keys = Object.keys(parameters),
      processed_parameter_keys = [],
      processed_parameters = {},
      result_string_array = [];

    // Process the headers.
    // 1) Process the parameter keys into lowercase, and
    // 2) Process values to URI encoded if applicable.
    parameter_keys.forEach(parameter_key => {
      if (!parameters.hasOwnProperty(parameter_key)) {
        return;
      }
      let processed_parameter_key = parameter_key.toLowerCase();
      processed_parameter_keys.push(processed_parameter_key);
      processed_parameters[processed_parameter_key] = encode
        ? encodeURIComponent(parameters[parameter_key])
        : parameters[parameter_key];
    });

    // Process into result string.
    processed_parameter_keys.sort().forEach(processed_parameter_key => {
      if (!processed_parameters.hasOwnProperty(processed_parameter_key)) {
        return;
      }
      result_string_array.push(
        `${processed_parameter_key}${value_prefix}${
          processed_parameters[processed_parameter_key]
        }${value_suffix}`
      );
    });
    return result_string_array.join(glue);
  };

  /**
   * Generate a UUID nonce.
   *
   * @returns {string}
   */
  let generateNonce = () => {
    let d = Date.now();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      var r = ((d + Math.random() * 16) % 16) | 0;
      d = Math.floor(d / 16);
      return (c === 'x' ? r : (r & 0x7) | 0x8).toString(16);
    });
  };

  /**
   * Determine if this request sends body content (or skips silently).
   *
   * Note: modern browsers always skip body at send(), when the request method is "GET" or "HEAD".
   *
   * @param body
   *   Body content.
   * @param method
   *   The request's method.
   * @returns {boolean}
   */
  let willSendBody = (body, method) => {
    let bodyless_request_types = ['GET', 'HEAD'];
    return body.length !== 0 && bodyless_request_types.indexOf(method) < 0;
  };

  // Compute the authorization headers.
  let nonce = generateNonce(),
    parser = AcquiaHttpHmac.parseUri(path),
    authorization_parameters = {
      id: this.config.public_key,
      nonce: nonce,
      realm: this.config.realm,
      version: this.config.version,
    },
    x_authorization_timestamp = Math.floor(Date.now() / 1000).toString(),
    x_authorization_content_sha256 = willSendBody(body, method)
      ? CryptoJS.SHA256(body).toString(CryptoJS.enc.Base64)
      : '',
    signature_base_string_content_suffix = willSendBody(body, method)
      ? `\n${content_type}\n${x_authorization_content_sha256}`
      : '',
    site_port = parser.port ? `:${parser.port}` : '',
    site_name_and_port = `${parser.hostname}${site_port}`,
    url_query_string = parser.search,
    signed_headers_string = parametersToString(
      signed_headers,
      ':',
      '',
      '\n',
      false
    ),
    signature_base_signed_headers_string =
      signed_headers_string === '' ? '' : `${signed_headers_string}\n`,
    signature_base_string = `${method}\n${site_name_and_port}\n${parser.pathname ||
      '/'}\n${url_query_string}\n${parametersToString(
      authorization_parameters
    )}\n${signature_base_signed_headers_string}${x_authorization_timestamp}${signature_base_string_content_suffix}`,
    authorization_string = parametersToString(
      authorization_parameters,
      '="',
      '"',
      ','
    ),
    authorization_signed_headers_string = encodeURI(
      Object.keys(signed_headers)
        .join('|||||')
        .toLowerCase()
        .split('|||||')
        .sort()
        .join(';')
    ),
    signature = encodeURI(
      CryptoJS.HmacSHA256(
        signature_base_string,
        this.config.parsed_secret_key
      ).toString(CryptoJS.enc.Base64)
    ),
    authorization = `acquia-http-hmac ${authorization_string},headers="${authorization_signed_headers_string}",signature="${signature}"`;

  // Set the authorizations headers.
  let headers = {
    'X-Authorization-Timestamp': x_authorization_timestamp,
    Authorization: authorization,
    'Access-Control-Allow-Origin': '*',
  };

  if (x_authorization_content_sha256) {
    headers['X-Authorization-Content-SHA256'] = x_authorization_content_sha256;
  }

  return headers;
};

/**
 * Check if the request has a valid response.
 *
 * @param {XMLHttpRequest|Object} request
 *   The request to be validated.
 * @returns {boolean}
 *   TRUE if the request is valid; FALSE otherwise.
 */

export default AcquiaHttpHmac;