import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Camera, Save, Loader2, Plus, X, Upload } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { usersApi, type User } from "../../apis/users";
import { authApi } from "../../apis/auth";
import { useAuth } from "../../contexts/AuthContext";

type ProfileFormData = {
  firstName: string;
  lastName: string;
  fullName: string;
  bio: string;
  workPlace: string;
  education: string;
  city: string;
  country: string;
  phoneNumber: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  interests: string[];
  profileVisibility: User["profileVisibility"];
  postVisibility: User["postVisibility"];
  showEmail: boolean;
  showPhone: boolean;
  avatar: string;
  coverPhoto: string;
};

export default function ProfileEdit() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { refreshSessionUser } = useAuth();
  const currentUser = authApi.getCurrentUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newInterest, setNewInterest] = useState("");

  // Image upload states
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [coverPhotoUrl, setCoverPhotoUrl] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: "",
    lastName: "",
    fullName: "",
    bio: "",
    workPlace: "",
    education: "",
    city: "",
    country: "",
    phoneNumber: "",
    email: "",
    dateOfBirth: "",
    gender: "",
    interests: [],
    profileVisibility: "PUBLIC",
    postVisibility: "PUBLIC",
    showEmail: false,
    showPhone: false,
    avatar: "",
    coverPhoto: "",
  });

  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser?.id) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        const profile = await usersApi.getUserById(currentUser.id);

        setFormData({
          firstName: profile.firstName || "",
          lastName: profile.lastName || "",
          fullName: profile.fullName || "",
          bio: profile.bio || "",
          workPlace: profile.workPlace || "",
          education: profile.education || "",
          city: profile.city || "",
          country: profile.country || "",
          phoneNumber: profile.phoneNumber || "",
          email: profile.email || "",
          dateOfBirth: profile.dateOfBirth || "",
          gender: profile.gender || "",
          interests: profile.interests || [],
          profileVisibility: profile.profileVisibility || "PUBLIC",
          postVisibility: profile.postVisibility || "PUBLIC",
          showEmail: profile.showEmail === true,
          showPhone: profile.showPhone === true,
          avatar: profile.avatar || "",
          coverPhoto: profile.coverPhoto || "",
        });

        setAvatarPreview(profile.avatar || "");
        setCoverPreview(profile.coverPhoto || "");
      } catch (error) {
        console.error("Failed to load profile:", error);
        alert(t("profilePage.edit.loadFailed"));
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [currentUser?.id, navigate]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleAddInterest = () => {
    const interest = newInterest.trim();
    if (interest && !formData.interests?.includes(interest)) {
      setFormData({
        ...formData,
        interests: [...(formData.interests || []), interest],
      });
      setNewInterest("");
    }
  };

  const handleRemoveInterest = (interestToRemove: string) => {
    setFormData({
      ...formData,
      interests:
        formData.interests?.filter(
          (interest) => interest !== interestToRemove,
        ) || [],
    });
  };

  // Handle local file upload for avatar
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert(t("profilePage.edit.imageTooLarge"));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setAvatarPreview(base64);
        setFormData({ ...formData, avatar: base64 });
        setShowAvatarModal(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle URL input for avatar
  const handleAvatarUrlSubmit = () => {
    if (avatarUrl.trim()) {
      setAvatarPreview(avatarUrl.trim());
      setFormData({ ...formData, avatar: avatarUrl.trim() });
      setAvatarUrl("");
      setShowAvatarModal(false);
    }
  };

  // Handle local file upload for cover photo
  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert(t("profilePage.edit.imageTooLarge"));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setCoverPreview(base64);
        setFormData({ ...formData, coverPhoto: base64 });
        setShowCoverModal(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle URL input for cover photo
  const handleCoverUrlSubmit = () => {
    if (coverPhotoUrl.trim()) {
      setCoverPreview(coverPhotoUrl.trim());
      setFormData({ ...formData, coverPhoto: coverPhotoUrl.trim() });
      setCoverPhotoUrl("");
      setShowCoverModal(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser?.id) return;

    try {
      setSaving(true);

      const payload: Record<string, any> = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        fullName:
          `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim(),
        profileVisibility: formData.profileVisibility,
        postVisibility: formData.postVisibility,
        showEmail: formData.showEmail === true,
        showPhone: formData.showPhone === true,
      };

      // Add images
      if (formData.avatar) {
        payload.avatar = formData.avatar;
      }
      if (formData.coverPhoto) {
        payload.coverPhoto = formData.coverPhoto;
      }

      const optionalFields: (keyof ProfileFormData)[] = [
        "bio",
        "email",
        "phoneNumber",
        "city",
        "country",
        "workPlace",
        "education",
        "gender",
        "dateOfBirth",
      ];

      optionalFields.forEach((field) => {
        const value = formData[field];
        if (typeof value === "string" && value.trim()) {
          payload[field] = value.trim();
        }
      });

      if (formData.interests && formData.interests.length > 0) {
        payload.interests = formData.interests;
      }

      await usersApi.updateUserProfile(currentUser.id, payload);
      await refreshSessionUser();

      alert(t("profilePage.edit.saveSuccess"));
      navigate(`/profile/${currentUser.id}`);
    } catch (error) {
      console.error("Failed to update profile:", error);
      const message =
        error instanceof Error
          ? error.message
          : t("profilePage.edit.saveFailed");
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const displayInitials =
    formData.firstName && formData.lastName
      ? `${formData.firstName[0]}${formData.lastName[0]}`.toUpperCase()
      : "NA";

  return (
    <div className="max-w-4xl mx-auto p-6 pb-20">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {t("profilePage.edit.title")}
        </h1>
        <p className="text-base text-gray-600 mt-1">
          {t("profilePage.edit.subtitle")}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cover Photo */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div
            className="h-64 relative bg-gradient-to-r from-blue-500 to-blue-600"
            style={
              coverPreview
                ? {
                    backgroundImage: `url(${coverPreview})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : {}
            }
          >
            <button
              type="button"
              onClick={() => setShowCoverModal(true)}
              className="absolute bottom-4 right-4 px-5 py-3 bg-white/90 hover:bg-white rounded-xl font-semibold text-gray-900 flex items-center gap-2 transition-colors shadow-lg"
            >
              <Camera className="w-5 h-5" />
              {t("profilePage.edit.changeCover")}
            </button>
          </div>
          <div className="p-6 -mt-16">
            <div className="relative inline-block">
              <div className="w-32 h-32 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-3xl shadow-xl border-4 border-white overflow-hidden">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt={t("profilePage.edit.avatarAlt")}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  displayInitials
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowAvatarModal(true)}
                className="absolute bottom-2 right-2 w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center text-white shadow-lg transition-colors"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Avatar Upload Modal */}
        {showAvatarModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">
                  {t("profilePage.edit.modalAvatarTitle")}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAvatarModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t("profilePage.edit.urlLabel")}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder={t("profilePage.edit.urlPlaceholder")}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleAvatarUrlSubmit}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {t("profilePage.edit.ok")}
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">
                      {t("profilePage.edit.or")}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t("profilePage.edit.uploadFromDevice")}
                  </label>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Upload className="w-5 h-5" />
                    {t("profilePage.edit.chooseFromComputer")}
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    {t("profilePage.edit.maxSize")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cover Photo Upload Modal */}
        {showCoverModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">
                  {t("profilePage.edit.modalCoverTitle")}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCoverModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t("profilePage.edit.urlLabel")}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={coverPhotoUrl}
                      onChange={(e) => setCoverPhotoUrl(e.target.value)}
                      placeholder={t("profilePage.edit.urlPlaceholder")}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleCoverUrlSubmit}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {t("profilePage.edit.ok")}
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">
                      {t("profilePage.edit.or")}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t("profilePage.edit.uploadFromDevice")}
                  </label>
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Upload className="w-5 h-5" />
                    {t("profilePage.edit.chooseFromComputer")}
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    {t("profilePage.edit.maxSize")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Basic Info */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {t("profilePage.edit.sectionBasic")}
          </h2>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-base font-semibold text-gray-900 mb-3">
                  {t("profilePage.edit.firstName")}
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full h-14 px-5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-gray-50 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-900 mb-3">
                  {t("profilePage.edit.lastName")}
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full h-14 px-5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-gray-50 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-900 mb-3">
                {t("profilePage.edit.bio")}
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={4}
                className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-gray-50 focus:bg-white transition-all resize-none"
                placeholder={t("profilePage.edit.bioPlaceholder")}
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-900 mb-3">
                {t("profilePage.edit.email")}
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full h-14 px-5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-gray-50 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-900 mb-3">
                {t("profilePage.edit.phone")}
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="w-full h-14 px-5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-gray-50 focus:bg-white transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-base font-semibold text-gray-900 mb-3">
                  {t("profilePage.edit.dateOfBirth")}
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full h-14 px-5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-gray-50 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-900 mb-3">
                  {t("profilePage.edit.gender")}
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full h-14 px-5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-gray-50 focus:bg-white transition-all"
                >
                  <option value="">
                    {t("profilePage.edit.genderPlaceholder")}
                  </option>
                  <option value="Nam">{t("profilePage.edit.genderMale")}</option>
                  <option value="Nữ">{t("profilePage.edit.genderFemale")}</option>
                  <option value="Khác">{t("profilePage.edit.genderOther")}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Work & Education */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {t("profilePage.edit.sectionWork")}
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-base font-semibold text-gray-900 mb-3">
                {t("profilePage.edit.workPlace")}
              </label>
              <input
                type="text"
                name="workPlace"
                value={formData.workPlace}
                onChange={handleChange}
                className="w-full h-14 px-5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-gray-50 focus:bg-white transition-all"
                placeholder={t("profilePage.edit.workPlacePlaceholder")}
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-900 mb-3">
                {t("profilePage.edit.education")}
              </label>
              <input
                type="text"
                name="education"
                value={formData.education}
                onChange={handleChange}
                className="w-full h-14 px-5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-gray-50 focus:bg-white transition-all"
                placeholder={t("profilePage.edit.educationPlaceholder")}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-base font-semibold text-gray-900 mb-3">
                  {t("profilePage.edit.city")}
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full h-14 px-5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-gray-50 focus:bg-white transition-all"
                  placeholder={t("profilePage.edit.cityPlaceholder")}
                />
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-900 mb-3">
                  {t("profilePage.edit.country")}
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full h-14 px-5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-gray-50 focus:bg-white transition-all"
                  placeholder={t("profilePage.edit.countryPlaceholder")}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Interests */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {t("profilePage.edit.sectionInterests")}
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-base font-semibold text-gray-900 mb-3">
                {t("profilePage.edit.addInterestLabel")}
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddInterest()}
                  className="flex-1 h-14 px-5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-gray-50 focus:bg-white transition-all"
                  placeholder={t("profilePage.edit.addInterestPlaceholder")}
                />
                <button
                  type="button"
                  onClick={handleAddInterest}
                  disabled={!newInterest.trim()}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-xl transition-colors disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {t("profilePage.edit.add")}
                </button>
              </div>
            </div>

            {formData.interests && formData.interests.length > 0 && (
              <div>
                <label className="block text-base font-semibold text-gray-900 mb-3">
                  {t("profilePage.edit.currentInterests")}
                </label>
                <div className="flex flex-wrap gap-2">
                  {formData.interests.map((interest, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                    >
                      <span>{interest}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveInterest(interest)}
                        className="w-4 h-4 rounded-full bg-blue-200 hover:bg-blue-300 flex items-center justify-center text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {t("profilePage.edit.sectionPrivacy")}
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-base font-semibold text-gray-900 mb-3">
                {t("profilePage.edit.whoCanSeeProfile")}
              </label>
              <select
                name="profileVisibility"
                value={formData.profileVisibility}
                onChange={handleChange}
                className="w-full h-14 px-5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-gray-50 focus:bg-white transition-all"
              >
                <option value="PUBLIC">
                  {t("profilePage.edit.visibilityPublic")}
                </option>
                <option value="FRIENDS">
                  {t("profilePage.edit.visibilityFriends")}
                </option>
                <option value="PRIVATE">
                  {t("profilePage.edit.visibilityPrivate")}
                </option>
              </select>
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-900 mb-3">
                {t("profilePage.edit.whoCanSeePosts")}
              </label>
              <select
                name="postVisibility"
                value={formData.postVisibility}
                onChange={handleChange}
                className="w-full h-14 px-5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-gray-50 focus:bg-white transition-all"
              >
                <option value="PUBLIC">
                  {t("profilePage.edit.visibilityPublic")}
                </option>
                <option value="FRIENDS">
                  {t("profilePage.edit.visibilityFriends")}
                </option>
                <option value="PRIVATE">
                  {t("profilePage.edit.visibilityPrivate")}
                </option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="showEmail"
                  checked={formData.showEmail}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-base text-gray-700">
                  {t("profilePage.edit.showEmailOnProfile")}
                </span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="showPhone"
                  checked={formData.showPhone}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-base text-gray-700">
                  {t("profilePage.edit.showPhoneOnProfile")}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link
            to={`/profile/${currentUser?.id}`}
            className="px-8 py-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-lg transition-colors"
          >
            {t("profilePage.edit.cancel")}
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg transition-colors shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t("profilePage.edit.saving")}
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                {t("profilePage.edit.save")}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
