import { MappedSensorItem, SensorItem } from "@/types/session";

const mapSensorItems = (items: SensorItem[]): MappedSensorItem[] => {
  return items.map((item) => ({
    value: item.value,
    dataPointText: item.dataPointText,
    label: item.timeStamp,
  }));
};

const toSensorItems = (items: MappedSensorItem[]): SensorItem[] => {
  return items.map((item) => ({
    value: item.value,
    dataPointText: item.dataPointText,
    timeStamp: item.label,
  }));
};
export { mapSensorItems, toSensorItems };
