import { useTranslation } from "react-i18next";

export default function PhotosTab() {
  const { t } = useTranslation();

  return (

    <div className="bg-white rounded-lg shadow-sm p-6">

      <h2 className="text-xl font-bold mb-4">
        {t("groupTabs.photosTitle")}
      </h2>

      <p className="text-gray-500">
        {t("groupTabs.photosEmpty")}
      </p>

    </div>

  );

}
