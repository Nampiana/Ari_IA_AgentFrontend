export const ApiUrl = `${process.env.REACT_APP_HOST_API || "http://localhost:4000/api/v1/"}`;

export const header = (type = "json") => {
  const token = localStorage.getItem("access_token");

  const headers = {
    json: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    image: {
      "Content-Type": "multipart/form-data",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };

  return {
    headers: headers[type] || headers.json,
  };
};