import { Image as ImageIcon, Smile } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function DiscussionTab() {
  const { t } = useTranslation();

  return (

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

      <div className="lg:col-span-2 space-y-4">

        <div className="bg-white rounded-lg shadow-sm p-4">

          <div className="flex items-center gap-3 mb-3">

            <div className="w-10 h-10 rounded-full bg-[#42B72A] flex items-center justify-center text-white font-semibold">
              JD
            </div>

            <input
              placeholder={t("groupTabs.discussionPlaceholder")}
              className="flex-1 h-10 px-4 rounded-full bg-[#F0F2F5]"
            />

          </div>

          <div className="flex justify-around pt-3 border-t">

            <button type="button" className="flex gap-2 text-sm">
              <ImageIcon className="w-5 h-5 text-[#42B72A]" />
              {t("groupTabs.photoVideo")}
            </button>

            <button type="button" className="flex gap-2 text-sm">
              <Smile className="w-5 h-5 text-[#F7B928]" />
              {t("groupTabs.feeling")}
            </button>

          </div>

        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500">
          {t("groupTabs.discussionEmpty")}
        </div>

      </div>

      <div className="space-y-4">

        <div className="bg-white rounded-lg shadow-sm p-4">

          <h3 className="font-bold mb-4">
            {t("groupTabs.sidebarAboutTitle")}
          </h3>

          <p className="text-sm text-gray-600">
            {t("groupTabs.sidebarAboutBody")}
          </p>

        </div>

      </div>

    </div>

  );

}
