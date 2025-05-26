const dateFormat = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  };
  return d.toLocaleString("vi-VN", options).replace(",", "");
};
const getTime = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  const options: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  };
  return d.toLocaleTimeString("vi-VN", options);
};

const getDate = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };
  return d.toLocaleDateString("vi-VN", options);
};

export { dateFormat, getDate, getTime };
