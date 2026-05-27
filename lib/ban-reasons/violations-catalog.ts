/**
 * Danh mục mã lý do cấm tài khoản (NetflixHub).
 * Mã `code` dùng trong bảng ban_reasons — admin chọn khi ban rental.
 */

export type BanViolationCategoryId =
  | 'account_security'
  | 'profile'
  | 'sharing_device'
  | 'location_vpn'
  | 'payment_subscription'
  | 'user_impact'
  | 'technical_automation'
  | 'policy_enforcement'

export type BanViolationEntry = {
  code: string
  category: BanViolationCategoryId
  titleVi: string
  titleEn: string
  descriptionVi?: string
  descriptionEn?: string
}

export const BAN_VIOLATION_CATEGORIES: Array<{
  id: BanViolationCategoryId
  titleVi: string
  titleEn: string
  sortBase: number
}> = [
  {
    id: 'account_security',
    titleVi: 'I. Vi phạm bảo mật tài khoản',
    titleEn: 'I. Account security violations',
    sortBase: 100,
  },
  {
    id: 'profile',
    titleVi: 'II. Vi phạm profile',
    titleEn: 'II. Profile violations',
    sortBase: 200,
  },
  {
    id: 'sharing_device',
    titleVi: 'III. Vi phạm chia sẻ & thiết bị',
    titleEn: 'III. Sharing & device violations',
    sortBase: 300,
  },
  {
    id: 'location_vpn',
    titleVi: 'IV. Vi phạm địa chỉ & VPN',
    titleEn: 'IV. Location & VPN violations',
    sortBase: 400,
  },
  {
    id: 'payment_subscription',
    titleVi: 'V. Vi phạm thanh toán & gói dịch vụ',
    titleEn: 'V. Payment & subscription violations',
    sortBase: 500,
  },
  {
    id: 'user_impact',
    titleVi: 'VI. Vi phạm ảnh hưởng người dùng khác',
    titleEn: 'VI. Impact on other users',
    sortBase: 600,
  },
  {
    id: 'technical_automation',
    titleVi: 'VII. Vi phạm kỹ thuật & automation',
    titleEn: 'VII. Technical & automation violations',
    sortBase: 700,
  },
  {
    id: 'policy_enforcement',
    titleVi: 'VIII. Chính sách xử lý vi phạm',
    titleEn: 'VIII. Violation policy (enforcement)',
    sortBase: 800,
  },
]

export const BAN_VIOLATIONS_CATALOG: BanViolationEntry[] = [
  // I. Bảo mật tài khoản
  {
    code: 'acct_change_password',
    category: 'account_security',
    titleVi: 'Tự ý đổi mật khẩu account',
    titleEn: 'Unauthorized password change',
  },
  {
    code: 'acct_logout_all_devices',
    category: 'account_security',
    titleVi: 'Tự ý đăng xuất toàn bộ thiết bị',
    titleEn: 'Unauthorized sign-out of all devices',
  },
  {
    code: 'acct_change_recovery_email',
    category: 'account_security',
    titleVi: 'Tự ý đổi email recovery',
    titleEn: 'Unauthorized recovery email change',
  },
  {
    code: 'acct_change_recovery_phone',
    category: 'account_security',
    titleVi: 'Tự ý đổi số điện thoại recovery',
    titleEn: 'Unauthorized recovery phone change',
  },
  {
    code: 'acct_request_owner_otp',
    category: 'account_security',
    titleVi: 'Yêu cầu OTP/email xác minh từ chủ account',
    titleEn: 'Requested owner OTP/verification codes',
  },
  {
    code: 'acct_spam_wrong_password',
    category: 'account_security',
    titleVi: 'Spam đăng nhập sai mật khẩu nhiều lần',
    titleEn: 'Repeated failed login attempts (spam)',
  },
  {
    code: 'acct_share_password',
    category: 'account_security',
    titleVi: 'Chia sẻ password cho người khác',
    titleEn: 'Shared account password with others',
  },
  {
    code: 'acct_share_session_cookie',
    category: 'account_security',
    titleVi: 'Share cookie/session đăng nhập',
    titleEn: 'Shared login session/cookies',
  },
  {
    code: 'acct_steal_session_tool',
    category: 'account_security',
    titleVi: 'Dùng tool lấy session/cookie account',
    titleEn: 'Used tools to steal session/cookies',
  },
  {
    code: 'acct_unauthorized_extension',
    category: 'account_security',
    titleVi: 'Extension/phần mềm can thiệp trái phép',
    titleEn: 'Unauthorized extension or interfering software',
  },
  {
    code: 'acct_impersonate_support',
    category: 'account_security',
    titleVi: 'Liên hệ support giả danh chủ account',
    titleEn: 'Impersonated account owner to support',
  },
  {
    code: 'acct_false_report_support',
    category: 'account_security',
    titleVi: 'Cố tình report account với support',
    titleEn: 'False report to platform support',
  },
  {
    code: 'acct_access_billing_settings',
    category: 'account_security',
    titleVi: 'Truy cập Billing/Account Settings trái phép',
    titleEn: 'Unauthorized Billing/Account Settings access',
  },

  // II. Profile
  {
    code: 'prof_delete_other_profile',
    category: 'profile',
    titleVi: 'Xóa profile của người khác',
    titleEn: 'Deleted another user’s profile',
  },
  {
    code: 'prof_rename_other_profile',
    category: 'profile',
    titleVi: 'Đổi tên profile của người khác',
    titleEn: 'Renamed another user’s profile',
  },
  {
    code: 'prof_change_other_avatar',
    category: 'profile',
    titleVi: 'Đổi avatar profile của người khác',
    titleEn: 'Changed another user’s profile avatar',
  },
  {
    code: 'prof_change_other_language',
    category: 'profile',
    titleVi: 'Đổi ngôn ngữ/cài đặt profile người khác',
    titleEn: 'Changed another profile’s language/settings',
  },
  {
    code: 'prof_change_maturity_rating',
    category: 'profile',
    titleVi: 'Đổi maturity rating/giới hạn profile',
    titleEn: 'Changed maturity rating/profile restrictions',
  },
  {
    code: 'prof_pin_lock_unowned',
    category: 'profile',
    titleVi: 'Đặt PIN khóa profile không thuộc quyền sở hữu',
    titleEn: 'Set PIN on profile not owned',
  },
  {
    code: 'prof_delete_other_history',
    category: 'profile',
    titleVi: 'Xóa lịch sử xem của profile khác',
    titleEn: 'Deleted another profile’s viewing history',
  },
  {
    code: 'prof_sabotage_recommendations',
    category: 'profile',
    titleVi: 'Phá recommendation/lịch sử gợi ý',
    titleEn: 'Sabotaged recommendations/viewing history',
  },
  {
    code: 'prof_takeover_owner_admin',
    category: 'profile',
    titleVi: 'Chiếm dụng profile Owner/Admin',
    titleEn: 'Took over Owner/Admin profile',
  },

  // III. Chia sẻ & thiết bị
  {
    code: 'share_resell_third_party',
    category: 'sharing_device',
    titleVi: 'Share lại account cho bên thứ ba',
    titleEn: 'Re-shared account to third parties',
  },
  {
    code: 'share_resell_rented_slot',
    category: 'sharing_device',
    titleVi: 'Bán lại slot/profile đã thuê',
    titleEn: 'Resold rented slot/profile',
  },
  {
    code: 'share_exceed_device_limit',
    category: 'sharing_device',
    titleVi: 'Đăng nhập vượt số thiết bị cho phép',
    titleEn: 'Exceeded allowed device count',
  },
  {
    code: 'share_many_devices_short_time',
    category: 'sharing_device',
    titleVi: 'Quá nhiều thiết bị trong thời gian ngắn',
    titleEn: 'Too many devices in a short period',
  },
  {
    code: 'share_public_device_login',
    category: 'sharing_device',
    titleVi: 'Đăng nhập TV công cộng/quán net/khách sạn',
    titleEn: 'Logged in on public TV/internet café/hotel',
  },
  {
    code: 'share_no_logout_public',
    category: 'sharing_device',
    titleVi: 'Không logout thiết bị công cộng',
    titleEn: 'Did not sign out from public device',
  },
  {
    code: 'share_multi_user_profile',
    category: 'sharing_device',
    titleVi: 'Nhiều người dùng chung một profile',
    titleEn: 'Multiple people used the same profile',
  },
  {
    code: 'share_exceed_screen_limit',
    category: 'sharing_device',
    titleVi: 'Streaming vượt số màn hình gói',
    titleEn: 'Streaming exceeded plan screen limit',
  },
  {
    code: 'share_commercial_use',
    category: 'sharing_device',
    titleVi: 'Dùng account cho mục đích thương mại/chiếu công cộng',
    titleEn: 'Commercial or public screening use',
  },

  // IV. VPN & địa chỉ
  {
    code: 'vpn_constant_country_switch',
    category: 'location_vpn',
    titleVi: 'VPN liên tục đổi quốc gia',
    titleEn: 'VPN with constant country switching',
  },
  {
    code: 'vpn_fake_location_abnormal',
    category: 'location_vpn',
    titleVi: 'Fake location bất thường nhiều khu vực',
    titleEn: 'Abnormal fake location across regions',
  },
  {
    code: 'vpn_multi_country_short_time',
    category: 'location_vpn',
    titleVi: 'Login nhiều quốc gia trong thời gian ngắn',
    titleEn: 'Logins from many countries in short time',
  },
  {
    code: 'vpn_proxy_hide_ip',
    category: 'location_vpn',
    titleVi: 'Proxy/dịch vụ ẩn IP gây ảnh hưởng account',
    titleEn: 'Proxy/IP-hiding affecting the account',
  },
  {
    code: 'vpn_suspicious_netflix_flag',
    category: 'location_vpn',
    titleVi: 'Hành vi bị Netflix đánh dấu suspicious',
    titleEn: 'Activity flagged as suspicious by Netflix',
  },

  // V. Thanh toán & gói
  {
    code: 'pay_change_subscription',
    category: 'payment_subscription',
    titleVi: 'Tự ý thay đổi gói subscription',
    titleEn: 'Unauthorized subscription plan change',
  },
  {
    code: 'pay_downgrade_upgrade',
    category: 'payment_subscription',
    titleVi: 'Tự ý downgrade/upgrade package',
    titleEn: 'Unauthorized downgrade/upgrade',
  },
  {
    code: 'pay_cancel_membership',
    category: 'payment_subscription',
    titleVi: 'Tự ý hủy membership',
    titleEn: 'Unauthorized membership cancellation',
  },
  {
    code: 'pay_add_payment_method',
    category: 'payment_subscription',
    titleVi: 'Tự ý thêm payment method',
    titleEn: 'Unauthorized payment method added',
  },
  {
    code: 'pay_remove_payment_method',
    category: 'payment_subscription',
    titleVi: 'Tự ý xóa payment method',
    titleEn: 'Unauthorized payment method removed',
  },
  {
    code: 'pay_add_extra_member',
    category: 'payment_subscription',
    titleVi: 'Tự ý thêm Extra Member (phát sinh chi phí)',
    titleEn: 'Unauthorized Extra Member (extra charge)',
  },
  {
    code: 'pay_unauthorized_transaction',
    category: 'payment_subscription',
    titleVi: 'Giao dịch trái phép trên account',
    titleEn: 'Unauthorized transaction on account',
  },

  // VI. Ảnh hưởng người khác
  {
    code: 'impact_force_logout_others',
    category: 'user_impact',
    titleVi: 'Làm người khác bị logout liên tục',
    titleEn: 'Caused others to be logged out repeatedly',
  },
  {
    code: 'impact_hog_stream_slots',
    category: 'user_impact',
    titleVi: 'Chiếm hết slot xem',
    titleEn: 'Monopolized all stream slots',
  },
  {
    code: 'impact_exceed_devices_streams',
    category: 'user_impact',
    titleVi: 'Dùng quá mức — full device/full stream',
    titleEn: 'Exceeded devices/streams (full capacity)',
  },
  {
    code: 'impact_disrupt_viewing',
    category: 'user_impact',
    titleVi: 'Phá trải nghiệm xem của người khác',
    titleEn: 'Disrupted others’ viewing experience',
  },
  {
    code: 'impact_change_global_settings',
    category: 'user_impact',
    titleVi: 'Đổi setting toàn account ảnh hưởng chung',
    titleEn: 'Changed account-wide settings affecting all',
  },
  {
    code: 'impact_spam_troll_profiles',
    category: 'user_impact',
    titleVi: 'Tạo profile rác/profile troll',
    titleEn: 'Created spam/troll profiles',
  },
  {
    code: 'impact_spam_security_check',
    category: 'user_impact',
    titleVi: 'Spam thao tác gây security check',
    titleEn: 'Spam actions triggering security checks',
  },

  // VII. Kỹ thuật
  {
    code: 'tech_bot_automation',
    category: 'technical_automation',
    titleVi: 'Bot/tool automation với account',
    titleEn: 'Bots/automation tools on account',
  },
  {
    code: 'tech_crawl_account_data',
    category: 'technical_automation',
    titleVi: 'Crawl/scan dữ liệu account',
    titleEn: 'Crawled or scanned account data',
  },
  {
    code: 'tech_auto_login_script',
    category: 'technical_automation',
    titleVi: 'Script auto login',
    titleEn: 'Automated login scripts',
  },
  {
    code: 'tech_bypass_household',
    category: 'technical_automation',
    titleVi: 'Phần mềm bypass household',
    titleEn: 'Household bypass tools',
  },
  {
    code: 'tech_crack_share_session',
    category: 'technical_automation',
    titleVi: 'Tool crack/share session',
    titleEn: 'Crack/session-sharing tools',
  },
  {
    code: 'tech_api_abuse',
    category: 'technical_automation',
    titleVi: 'Can thiệp API trái phép',
    titleEn: 'Unauthorized API abuse',
  },
  {
    code: 'tech_risk_account_restriction',
    category: 'technical_automation',
    titleVi: 'Hành vi nguy cơ khóa/hạn chế account',
    titleEn: 'Actions risking account lock/restriction',
  },

  // VIII. Chính sách (dùng khi cần mã tổng hợp / nhắc chính sách)
  {
    code: 'policy_immediate_revoke',
    category: 'policy_enforcement',
    titleVi: 'Vi phạm — khóa profile ngay (chính sách)',
    titleEn: 'Violation — immediate profile revoke (policy)',
    descriptionVi: 'Theo chính sách: vi phạm sẽ bị khóa profile ngay lập tức.',
    descriptionEn: 'Per policy: violations result in immediate profile revocation.',
  },
  {
    code: 'policy_no_refund',
    category: 'policy_enforcement',
    titleVi: 'Vi phạm — không hoàn tiền (chính sách)',
    titleEn: 'Violation — no refund (policy)',
    descriptionVi: 'Không hoàn tiền với các trường hợp vi phạm.',
    descriptionEn: 'No refunds for violation cases.',
  },
  {
    code: 'policy_tenant_liability',
    category: 'policy_enforcement',
    titleVi: 'Người thuê chịu trách nhiệm khóa account',
    titleEn: 'Renter liable for account restrictions',
    descriptionVi: 'Người thuê tự chịu trách nhiệm nếu làm account bị khóa/hạn chế.',
    descriptionEn: 'Renter is responsible if their actions get the account restricted.',
  },
  {
    code: 'policy_deny_support_forever',
    category: 'policy_enforcement',
    titleVi: 'Từ chối hỗ trợ vĩnh viễn (thiệt hại account)',
    titleEn: 'Permanent support denial (account damage)',
  },
  {
    code: 'policy_no_sabotage',
    category: 'policy_enforcement',
    titleVi: 'Phá hoại/chiếm quyền sở hữu account',
    titleEn: 'Sabotage or seizing account ownership',
    descriptionVi: 'Nghiêm cấm mọi hành vi phá hoại hoặc chiếm quyền sở hữu account.',
    descriptionEn: 'Strictly prohibited: sabotage or taking over account ownership.',
  },
  {
    code: 'policy_owner_password_rights',
    category: 'policy_enforcement',
    titleVi: 'Chủ account đổi MK/logout thiết bị (vi phạm)',
    titleEn: 'Owner password/device action after violation',
    descriptionVi: 'Chủ account có quyền đổi password và logout thiết bị bất cứ lúc nào.',
    descriptionEn: 'Account owner may change password and sign out devices anytime.',
  },
]

/** Gán sort_order theo thứ tự trong catalog + nhóm category */
export function catalogWithSortOrder() {
  const catIndex = new Map(
    BAN_VIOLATION_CATEGORIES.map((c, i) => [c.id, c.sortBase + i]),
  )
  return BAN_VIOLATIONS_CATALOG.map((entry, index) => ({
    ...entry,
    sortOrder: (catIndex.get(entry.category) ?? 900) + index,
  }))
}

export function categoryForBanCode(code: string): BanViolationCategoryId | null {
  const found = BAN_VIOLATIONS_CATALOG.find((e) => e.code === code)
  return found?.category ?? null
}

export function groupBanReasonsByCategory<
  T extends { code: string; title_vi: string; title_en: string; id: string },
>(reasons: T[], language: 'vi' | 'en') {
  const byCode = new Map(BAN_VIOLATIONS_CATALOG.map((e) => [e.code, e.category]))
  const groups = new Map<BanViolationCategoryId, T[]>()

  for (const cat of BAN_VIOLATION_CATEGORIES) {
    groups.set(cat.id, [])
  }

  const uncategorized: T[] = []
  for (const r of reasons) {
    const cat = byCode.get(r.code)
    if (cat && groups.has(cat)) {
      groups.get(cat)!.push(r)
    } else {
      uncategorized.push(r)
    }
  }

  return BAN_VIOLATION_CATEGORIES.map((cat) => ({
    category: cat,
    label: language === 'vi' ? cat.titleVi : cat.titleEn,
    reasons: groups.get(cat.id) ?? [],
  })).filter((g) => g.reasons.length > 0).concat(
    uncategorized.length
      ? [
          {
            category: {
              id: 'policy_enforcement' as BanViolationCategoryId,
              titleVi: 'Khác (mã cũ / tùy chỉnh)',
              titleEn: 'Other (legacy / custom)',
              sortBase: 999,
            },
            label: language === 'vi' ? 'Khác (mã cũ / tùy chỉnh)' : 'Other (legacy / custom)',
            reasons: uncategorized,
          },
        ]
      : [],
  )
}
