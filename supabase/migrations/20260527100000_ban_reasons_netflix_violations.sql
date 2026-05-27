-- Danh mục mã lý do cấm Netflix (tự sinh từ lib/ban-reasons/violations-catalog.ts)
-- Chạy: npx tsx scripts/gen-ban-reasons-sql.ts để tái tạo
-- An toàn nếu chưa chạy 20260525400000_short_term_and_ban.sql (tự CREATE TABLE)

-- Tạo bảng nếu chưa chạy migration 20260525400000_short_term_and_ban.sql
CREATE TABLE IF NOT EXISTS public.ban_reasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  title_vi VARCHAR(255) NOT NULL,
  title_en VARCHAR(255) NOT NULL,
  description_vi TEXT,
  description_en TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.purchased_accounts
  ADD COLUMN IF NOT EXISTS ban_reason_id UUID REFERENCES public.ban_reasons(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS banned_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ban_admin_note TEXT;

DROP TRIGGER IF EXISTS trg_ban_reasons_updated_at ON public.ban_reasons;
CREATE TRIGGER trg_ban_reasons_updated_at
  BEFORE UPDATE ON public.ban_reasons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.ban_reasons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_ban_reasons" ON public.ban_reasons;
DROP POLICY IF EXISTS "public_all_ban_reasons" ON public.ban_reasons;
CREATE POLICY "public_read_ban_reasons" ON public.ban_reasons FOR SELECT USING (true);
CREATE POLICY "public_all_ban_reasons" ON public.ban_reasons FOR ALL USING (true);


INSERT INTO public.ban_reasons (code, title_vi, title_en, description_vi, description_en, sort_order, is_active)
VALUES
  ('acct_change_password', 'Tự ý đổi mật khẩu account', 'Unauthorized password change', 'Tự ý đổi mật khẩu account', 'Unauthorized password change', 100, true),
  ('acct_logout_all_devices', 'Tự ý đăng xuất toàn bộ thiết bị', 'Unauthorized sign-out of all devices', 'Tự ý đăng xuất toàn bộ thiết bị', 'Unauthorized sign-out of all devices', 101, true),
  ('acct_change_recovery_email', 'Tự ý đổi email recovery', 'Unauthorized recovery email change', 'Tự ý đổi email recovery', 'Unauthorized recovery email change', 102, true),
  ('acct_change_recovery_phone', 'Tự ý đổi số điện thoại recovery', 'Unauthorized recovery phone change', 'Tự ý đổi số điện thoại recovery', 'Unauthorized recovery phone change', 103, true),
  ('acct_request_owner_otp', 'Yêu cầu OTP/email xác minh từ chủ account', 'Requested owner OTP/verification codes', 'Yêu cầu OTP/email xác minh từ chủ account', 'Requested owner OTP/verification codes', 104, true),
  ('acct_spam_wrong_password', 'Spam đăng nhập sai mật khẩu nhiều lần', 'Repeated failed login attempts (spam)', 'Spam đăng nhập sai mật khẩu nhiều lần', 'Repeated failed login attempts (spam)', 105, true),
  ('acct_share_password', 'Chia sẻ password cho người khác', 'Shared account password with others', 'Chia sẻ password cho người khác', 'Shared account password with others', 106, true),
  ('acct_share_session_cookie', 'Share cookie/session đăng nhập', 'Shared login session/cookies', 'Share cookie/session đăng nhập', 'Shared login session/cookies', 107, true),
  ('acct_steal_session_tool', 'Dùng tool lấy session/cookie account', 'Used tools to steal session/cookies', 'Dùng tool lấy session/cookie account', 'Used tools to steal session/cookies', 108, true),
  ('acct_unauthorized_extension', 'Extension/phần mềm can thiệp trái phép', 'Unauthorized extension or interfering software', 'Extension/phần mềm can thiệp trái phép', 'Unauthorized extension or interfering software', 109, true),
  ('acct_impersonate_support', 'Liên hệ support giả danh chủ account', 'Impersonated account owner to support', 'Liên hệ support giả danh chủ account', 'Impersonated account owner to support', 110, true),
  ('acct_false_report_support', 'Cố tình report account với support', 'False report to platform support', 'Cố tình report account với support', 'False report to platform support', 111, true),
  ('acct_access_billing_settings', 'Truy cập Billing/Account Settings trái phép', 'Unauthorized Billing/Account Settings access', 'Truy cập Billing/Account Settings trái phép', 'Unauthorized Billing/Account Settings access', 112, true),
  ('prof_delete_other_profile', 'Xóa profile của người khác', 'Deleted another user’s profile', 'Xóa profile của người khác', 'Deleted another user’s profile', 214, true),
  ('prof_rename_other_profile', 'Đổi tên profile của người khác', 'Renamed another user’s profile', 'Đổi tên profile của người khác', 'Renamed another user’s profile', 215, true),
  ('prof_change_other_avatar', 'Đổi avatar profile của người khác', 'Changed another user’s profile avatar', 'Đổi avatar profile của người khác', 'Changed another user’s profile avatar', 216, true),
  ('prof_change_other_language', 'Đổi ngôn ngữ/cài đặt profile người khác', 'Changed another profile’s language/settings', 'Đổi ngôn ngữ/cài đặt profile người khác', 'Changed another profile’s language/settings', 217, true),
  ('prof_change_maturity_rating', 'Đổi maturity rating/giới hạn profile', 'Changed maturity rating/profile restrictions', 'Đổi maturity rating/giới hạn profile', 'Changed maturity rating/profile restrictions', 218, true),
  ('prof_pin_lock_unowned', 'Đặt PIN khóa profile không thuộc quyền sở hữu', 'Set PIN on profile not owned', 'Đặt PIN khóa profile không thuộc quyền sở hữu', 'Set PIN on profile not owned', 219, true),
  ('prof_delete_other_history', 'Xóa lịch sử xem của profile khác', 'Deleted another profile’s viewing history', 'Xóa lịch sử xem của profile khác', 'Deleted another profile’s viewing history', 220, true),
  ('prof_sabotage_recommendations', 'Phá recommendation/lịch sử gợi ý', 'Sabotaged recommendations/viewing history', 'Phá recommendation/lịch sử gợi ý', 'Sabotaged recommendations/viewing history', 221, true),
  ('prof_takeover_owner_admin', 'Chiếm dụng profile Owner/Admin', 'Took over Owner/Admin profile', 'Chiếm dụng profile Owner/Admin', 'Took over Owner/Admin profile', 222, true),
  ('share_resell_third_party', 'Share lại account cho bên thứ ba', 'Re-shared account to third parties', 'Share lại account cho bên thứ ba', 'Re-shared account to third parties', 324, true),
  ('share_resell_rented_slot', 'Bán lại slot/profile đã thuê', 'Resold rented slot/profile', 'Bán lại slot/profile đã thuê', 'Resold rented slot/profile', 325, true),
  ('share_exceed_device_limit', 'Đăng nhập vượt số thiết bị cho phép', 'Exceeded allowed device count', 'Đăng nhập vượt số thiết bị cho phép', 'Exceeded allowed device count', 326, true),
  ('share_many_devices_short_time', 'Quá nhiều thiết bị trong thời gian ngắn', 'Too many devices in a short period', 'Quá nhiều thiết bị trong thời gian ngắn', 'Too many devices in a short period', 327, true),
  ('share_public_device_login', 'Đăng nhập TV công cộng/quán net/khách sạn', 'Logged in on public TV/internet café/hotel', 'Đăng nhập TV công cộng/quán net/khách sạn', 'Logged in on public TV/internet café/hotel', 328, true),
  ('share_no_logout_public', 'Không logout thiết bị công cộng', 'Did not sign out from public device', 'Không logout thiết bị công cộng', 'Did not sign out from public device', 329, true),
  ('share_multi_user_profile', 'Nhiều người dùng chung một profile', 'Multiple people used the same profile', 'Nhiều người dùng chung một profile', 'Multiple people used the same profile', 330, true),
  ('share_exceed_screen_limit', 'Streaming vượt số màn hình gói', 'Streaming exceeded plan screen limit', 'Streaming vượt số màn hình gói', 'Streaming exceeded plan screen limit', 331, true),
  ('share_commercial_use', 'Dùng account cho mục đích thương mại/chiếu công cộng', 'Commercial or public screening use', 'Dùng account cho mục đích thương mại/chiếu công cộng', 'Commercial or public screening use', 332, true),
  ('vpn_constant_country_switch', 'VPN liên tục đổi quốc gia', 'VPN with constant country switching', 'VPN liên tục đổi quốc gia', 'VPN with constant country switching', 434, true),
  ('vpn_fake_location_abnormal', 'Fake location bất thường nhiều khu vực', 'Abnormal fake location across regions', 'Fake location bất thường nhiều khu vực', 'Abnormal fake location across regions', 435, true),
  ('vpn_multi_country_short_time', 'Login nhiều quốc gia trong thời gian ngắn', 'Logins from many countries in short time', 'Login nhiều quốc gia trong thời gian ngắn', 'Logins from many countries in short time', 436, true),
  ('vpn_proxy_hide_ip', 'Proxy/dịch vụ ẩn IP gây ảnh hưởng account', 'Proxy/IP-hiding affecting the account', 'Proxy/dịch vụ ẩn IP gây ảnh hưởng account', 'Proxy/IP-hiding affecting the account', 437, true),
  ('vpn_suspicious_netflix_flag', 'Hành vi bị Netflix đánh dấu suspicious', 'Activity flagged as suspicious by Netflix', 'Hành vi bị Netflix đánh dấu suspicious', 'Activity flagged as suspicious by Netflix', 438, true),
  ('pay_change_subscription', 'Tự ý thay đổi gói subscription', 'Unauthorized subscription plan change', 'Tự ý thay đổi gói subscription', 'Unauthorized subscription plan change', 540, true),
  ('pay_downgrade_upgrade', 'Tự ý downgrade/upgrade package', 'Unauthorized downgrade/upgrade', 'Tự ý downgrade/upgrade package', 'Unauthorized downgrade/upgrade', 541, true),
  ('pay_cancel_membership', 'Tự ý hủy membership', 'Unauthorized membership cancellation', 'Tự ý hủy membership', 'Unauthorized membership cancellation', 542, true),
  ('pay_add_payment_method', 'Tự ý thêm payment method', 'Unauthorized payment method added', 'Tự ý thêm payment method', 'Unauthorized payment method added', 543, true),
  ('pay_remove_payment_method', 'Tự ý xóa payment method', 'Unauthorized payment method removed', 'Tự ý xóa payment method', 'Unauthorized payment method removed', 544, true),
  ('pay_add_extra_member', 'Tự ý thêm Extra Member (phát sinh chi phí)', 'Unauthorized Extra Member (extra charge)', 'Tự ý thêm Extra Member (phát sinh chi phí)', 'Unauthorized Extra Member (extra charge)', 545, true),
  ('pay_unauthorized_transaction', 'Giao dịch trái phép trên account', 'Unauthorized transaction on account', 'Giao dịch trái phép trên account', 'Unauthorized transaction on account', 546, true),
  ('impact_force_logout_others', 'Làm người khác bị logout liên tục', 'Caused others to be logged out repeatedly', 'Làm người khác bị logout liên tục', 'Caused others to be logged out repeatedly', 648, true),
  ('impact_hog_stream_slots', 'Chiếm hết slot xem', 'Monopolized all stream slots', 'Chiếm hết slot xem', 'Monopolized all stream slots', 649, true),
  ('impact_exceed_devices_streams', 'Dùng quá mức — full device/full stream', 'Exceeded devices/streams (full capacity)', 'Dùng quá mức — full device/full stream', 'Exceeded devices/streams (full capacity)', 650, true),
  ('impact_disrupt_viewing', 'Phá trải nghiệm xem của người khác', 'Disrupted others’ viewing experience', 'Phá trải nghiệm xem của người khác', 'Disrupted others’ viewing experience', 651, true),
  ('impact_change_global_settings', 'Đổi setting toàn account ảnh hưởng chung', 'Changed account-wide settings affecting all', 'Đổi setting toàn account ảnh hưởng chung', 'Changed account-wide settings affecting all', 652, true),
  ('impact_spam_troll_profiles', 'Tạo profile rác/profile troll', 'Created spam/troll profiles', 'Tạo profile rác/profile troll', 'Created spam/troll profiles', 653, true),
  ('impact_spam_security_check', 'Spam thao tác gây security check', 'Spam actions triggering security checks', 'Spam thao tác gây security check', 'Spam actions triggering security checks', 654, true),
  ('tech_bot_automation', 'Bot/tool automation với account', 'Bots/automation tools on account', 'Bot/tool automation với account', 'Bots/automation tools on account', 756, true),
  ('tech_crawl_account_data', 'Crawl/scan dữ liệu account', 'Crawled or scanned account data', 'Crawl/scan dữ liệu account', 'Crawled or scanned account data', 757, true),
  ('tech_auto_login_script', 'Script auto login', 'Automated login scripts', 'Script auto login', 'Automated login scripts', 758, true),
  ('tech_bypass_household', 'Phần mềm bypass household', 'Household bypass tools', 'Phần mềm bypass household', 'Household bypass tools', 759, true),
  ('tech_crack_share_session', 'Tool crack/share session', 'Crack/session-sharing tools', 'Tool crack/share session', 'Crack/session-sharing tools', 760, true),
  ('tech_api_abuse', 'Can thiệp API trái phép', 'Unauthorized API abuse', 'Can thiệp API trái phép', 'Unauthorized API abuse', 761, true),
  ('tech_risk_account_restriction', 'Hành vi nguy cơ khóa/hạn chế account', 'Actions risking account lock/restriction', 'Hành vi nguy cơ khóa/hạn chế account', 'Actions risking account lock/restriction', 762, true),
  ('policy_immediate_revoke', 'Vi phạm — khóa profile ngay (chính sách)', 'Violation — immediate profile revoke (policy)', 'Theo chính sách: vi phạm sẽ bị khóa profile ngay lập tức.', 'Per policy: violations result in immediate profile revocation.', 864, true),
  ('policy_no_refund', 'Vi phạm — không hoàn tiền (chính sách)', 'Violation — no refund (policy)', 'Không hoàn tiền với các trường hợp vi phạm.', 'No refunds for violation cases.', 865, true),
  ('policy_tenant_liability', 'Người thuê chịu trách nhiệm khóa account', 'Renter liable for account restrictions', 'Người thuê tự chịu trách nhiệm nếu làm account bị khóa/hạn chế.', 'Renter is responsible if their actions get the account restricted.', 866, true),
  ('policy_deny_support_forever', 'Từ chối hỗ trợ vĩnh viễn (thiệt hại account)', 'Permanent support denial (account damage)', 'Từ chối hỗ trợ vĩnh viễn (thiệt hại account)', 'Permanent support denial (account damage)', 867, true),
  ('policy_no_sabotage', 'Phá hoại/chiếm quyền sở hữu account', 'Sabotage or seizing account ownership', 'Nghiêm cấm mọi hành vi phá hoại hoặc chiếm quyền sở hữu account.', 'Strictly prohibited: sabotage or taking over account ownership.', 868, true),
  ('policy_owner_password_rights', 'Chủ account đổi MK/logout thiết bị (vi phạm)', 'Owner password/device action after violation', 'Chủ account có quyền đổi password và logout thiết bị bất cứ lúc nào.', 'Account owner may change password and sign out devices anytime.', 869, true)
ON CONFLICT (code) DO UPDATE SET
  title_vi = EXCLUDED.title_vi,
  title_en = EXCLUDED.title_en,
  description_vi = EXCLUDED.description_vi,
  description_en = EXCLUDED.description_en,
  sort_order = EXCLUDED.sort_order,
  is_active = true;
