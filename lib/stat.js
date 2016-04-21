var stat = {};

stat.checkResponse = function (allowedStatuses, response) {
  if (allowedStatuses.indexOf(response.status) < 0) {
    throw response;
  }
  return JSON.parse(response.data);
};

stat.checkNoContentResponse = function (response) {
  if (response.status != 204) {
    throw response;
  }
  return true;
};

stat.checkStandardResponse = stat.checkResponse.bind(null, [200]);
stat.checkCreatedResponse = stat.checkResponse.bind(null, [201]);

stat.checkOkResponse = function (response) {
  var data = stat.checkStandardResponse(response);

  if (!data.ok) {
    throw response;
  }

  return data.data;
};

module.exports = stat;
