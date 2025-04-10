import UserProfilePageDs from "@pages/user-profile-ds";
import UserProfilePageQs from "@pages/user-profile-qs";
export default function OptionsPage({ fixedClass }: any) {
    console.log(fixedClass.fixedClassStudent, "fixedClass")
    return <UserProfilePageDs />
}