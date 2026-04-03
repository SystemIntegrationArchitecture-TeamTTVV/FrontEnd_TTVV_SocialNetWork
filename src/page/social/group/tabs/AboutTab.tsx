import type { GroupData } from "../../../../apis/groupsApi";
import { useTranslation } from "react-i18next";

interface Props {
  group: GroupData;
}

export default function AboutTab({ group }: Props) {
  const { t } = useTranslation();

  return (

    <div className="bg-white rounded-lg shadow-sm p-6">

      <h2 className="text-xl font-bold mb-4">
        {t("groupTabs.aboutTitle")}
      </h2>

      <p className="text-gray-600">
        {group.description || t("groupTabs.noDescription")}
      </p>

      <div className="mt-4 text-sm text-gray-500 space-y-1">
        <p>{t("groupTabs.aboutPublicLine")}</p>
        <p>{t("groupTabs.aboutLocationLine")}</p>
      </div>

    </div>

  );

}
