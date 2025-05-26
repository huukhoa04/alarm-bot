export type SessionItem = {
  id: string;
  created_at: string;
  stats: {
    temperature: {
      value: number;
      dataPointText: string;
      timeStamp: string;
    }[];
    humidity: {
      value: number;
      dataPointText: string;
      timeStamp: string;
    }[];
    gasPressure: {
      value: number;
      dataPointText: string;
      timeStamp: string;
    }[];
  };
};

export type SensorItem = {
  value: number;
  dataPointText: string;
  timeStamp: string;
};

export type MappedSensorItem = {
  value: number;
  dataPointText: string;
  label: string;
};
