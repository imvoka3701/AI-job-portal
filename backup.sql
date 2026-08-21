--
-- PostgreSQL database dump
--

\restrict 7jZTxTyH0bWfJWwCq3BnjDNMhZfRvP7pAO0a5FSfNYM9bmg2g8miHD9XRz6GcKg

-- Dumped from database version 17.10 (Debian 17.10-1.pgdg12+1)
-- Dumped by pg_dump version 17.10 (Debian 17.10-1.pgdg12+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.round_criteria_scores DROP CONSTRAINT IF EXISTS round_criteria_scores_round_id_fkey;
ALTER TABLE IF EXISTS ONLY public.resumes DROP CONSTRAINT IF EXISTS resumes_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.recruitment_requests DROP CONSTRAINT IF EXISTS recruitment_requests_reviewed_by_id_fkey;
ALTER TABLE IF EXISTS ONLY public.recruitment_requests DROP CONSTRAINT IF EXISTS recruitment_requests_requested_by_id_fkey;
ALTER TABLE IF EXISTS ONLY public.recruitment_requests DROP CONSTRAINT IF EXISTS recruitment_requests_department_id_fkey;
ALTER TABLE IF EXISTS ONLY public.recruitment_requests DROP CONSTRAINT IF EXISTS recruitment_requests_converted_job_id_fkey;
ALTER TABLE IF EXISTS ONLY public.recruitment_requests DROP CONSTRAINT IF EXISTS recruitment_requests_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.oauth_accounts DROP CONSTRAINT IF EXISTS oauth_accounts_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.jobs DROP CONSTRAINT IF EXISTS jobs_employer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.jobs DROP CONSTRAINT IF EXISTS jobs_category_id_fkey;
ALTER TABLE IF EXISTS ONLY public.job_assignments DROP CONSTRAINT IF EXISTS job_assignments_membership_id_fkey;
ALTER TABLE IF EXISTS ONLY public.job_assignments DROP CONSTRAINT IF EXISTS job_assignments_job_id_fkey;
ALTER TABLE IF EXISTS ONLY public.job_assignments DROP CONSTRAINT IF EXISTS job_assignments_assigned_by_fkey;
ALTER TABLE IF EXISTS ONLY public.interview_rounds DROP CONSTRAINT IF EXISTS interview_rounds_reviewer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.interview_rounds DROP CONSTRAINT IF EXISTS interview_rounds_marked_by_admin_id_fkey;
ALTER TABLE IF EXISTS ONLY public.interview_rounds DROP CONSTRAINT IF EXISTS interview_rounds_application_id_fkey;
ALTER TABLE IF EXISTS ONLY public.jobs DROP CONSTRAINT IF EXISTS fk_jobs_department_id;
ALTER TABLE IF EXISTS ONLY public.jobs DROP CONSTRAINT IF EXISTS fk_jobs_company_id;
ALTER TABLE IF EXISTS ONLY public.applications DROP CONSTRAINT IF EXISTS fk_applications_recommendation_by;
ALTER TABLE IF EXISTS ONLY public.applications DROP CONSTRAINT IF EXISTS fk_applications_decision_by;
ALTER TABLE IF EXISTS ONLY public.applications DROP CONSTRAINT IF EXISTS fk_applications_cv_document_id;
ALTER TABLE IF EXISTS ONLY public.admin_audit_logs DROP CONSTRAINT IF EXISTS fk_admin_audit_logs_company_id;
ALTER TABLE IF EXISTS ONLY public.departments DROP CONSTRAINT IF EXISTS departments_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.cv_documents DROP CONSTRAINT IF EXISTS cv_documents_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.company_memberships DROP CONSTRAINT IF EXISTS company_memberships_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.company_memberships DROP CONSTRAINT IF EXISTS company_memberships_invited_by_fkey;
ALTER TABLE IF EXISTS ONLY public.company_memberships DROP CONSTRAINT IF EXISTS company_memberships_department_id_fkey;
ALTER TABLE IF EXISTS ONLY public.company_memberships DROP CONSTRAINT IF EXISTS company_memberships_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.company_invitations DROP CONSTRAINT IF EXISTS company_invitations_invited_by_fkey;
ALTER TABLE IF EXISTS ONLY public.company_invitations DROP CONSTRAINT IF EXISTS company_invitations_department_id_fkey;
ALTER TABLE IF EXISTS ONLY public.company_invitations DROP CONSTRAINT IF EXISTS company_invitations_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.companies DROP CONSTRAINT IF EXISTS companies_created_by_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.assessment_attempts DROP CONSTRAINT IF EXISTS assessment_attempts_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.applications DROP CONSTRAINT IF EXISTS applications_resume_id_fkey;
ALTER TABLE IF EXISTS ONLY public.applications DROP CONSTRAINT IF EXISTS applications_job_id_fkey;
ALTER TABLE IF EXISTS ONLY public.applications DROP CONSTRAINT IF EXISTS applications_candidate_id_fkey;
ALTER TABLE IF EXISTS ONLY public.admin_audit_logs DROP CONSTRAINT IF EXISTS admin_audit_logs_actor_user_id_fkey;
DROP INDEX IF EXISTS public.ix_users_id;
DROP INDEX IF EXISTS public.ix_users_email;
DROP INDEX IF EXISTS public.ix_round_criteria_scores_round_id;
DROP INDEX IF EXISTS public.ix_round_criteria_scores_id;
DROP INDEX IF EXISTS public.ix_resumes_id;
DROP INDEX IF EXISTS public.ix_resumes_embedding_hnsw;
DROP INDEX IF EXISTS public.ix_recruitment_requests_requested_by_id;
DROP INDEX IF EXISTS public.ix_recruitment_requests_department_id;
DROP INDEX IF EXISTS public.ix_recruitment_requests_company_id;
DROP INDEX IF EXISTS public.ix_recruitment_request_department_status;
DROP INDEX IF EXISTS public.ix_recruitment_request_company_status;
DROP INDEX IF EXISTS public.ix_oauth_accounts_user_id;
DROP INDEX IF EXISTS public.ix_oauth_accounts_id;
DROP INDEX IF EXISTS public.ix_notifications_user_id;
DROP INDEX IF EXISTS public.ix_notifications_id;
DROP INDEX IF EXISTS public.ix_jobs_title;
DROP INDEX IF EXISTS public.ix_jobs_id;
DROP INDEX IF EXISTS public.ix_jobs_embedding_hnsw;
DROP INDEX IF EXISTS public.ix_jobs_department_id;
DROP INDEX IF EXISTS public.ix_jobs_company_id;
DROP INDEX IF EXISTS public.ix_job_categories_id;
DROP INDEX IF EXISTS public.ix_job_assignments_membership_id;
DROP INDEX IF EXISTS public.ix_job_assignments_job_id;
DROP INDEX IF EXISTS public.ix_interview_rounds_review_status;
DROP INDEX IF EXISTS public.ix_interview_rounds_overdue;
DROP INDEX IF EXISTS public.ix_interview_rounds_needs_review;
DROP INDEX IF EXISTS public.ix_interview_rounds_id;
DROP INDEX IF EXISTS public.ix_interview_rounds_application_id;
DROP INDEX IF EXISTS public.ix_departments_company_id;
DROP INDEX IF EXISTS public.ix_cv_documents_user_id;
DROP INDEX IF EXISTS public.ix_cv_documents_id;
DROP INDEX IF EXISTS public.ix_company_memberships_user_id;
DROP INDEX IF EXISTS public.ix_company_memberships_department_id;
DROP INDEX IF EXISTS public.ix_company_memberships_company_id;
DROP INDEX IF EXISTS public.ix_company_membership_scope;
DROP INDEX IF EXISTS public.ix_company_invitations_email;
DROP INDEX IF EXISTS public.ix_company_invitations_company_id;
DROP INDEX IF EXISTS public.ix_company_invitation_lookup;
DROP INDEX IF EXISTS public.ix_companies_name;
DROP INDEX IF EXISTS public.ix_companies_created_by_user_id;
DROP INDEX IF EXISTS public.ix_assessment_attempts_user_id;
DROP INDEX IF EXISTS public.ix_assessment_attempts_id;
DROP INDEX IF EXISTS public.ix_assessment_attempts_assessment_type;
DROP INDEX IF EXISTS public.ix_assessment_attempt_user_type;
DROP INDEX IF EXISTS public.ix_applications_id;
DROP INDEX IF EXISTS public.ix_admin_audit_target;
DROP INDEX IF EXISTS public.ix_admin_audit_logs_target_type;
DROP INDEX IF EXISTS public.ix_admin_audit_logs_created_at;
DROP INDEX IF EXISTS public.ix_admin_audit_logs_company_id;
DROP INDEX IF EXISTS public.ix_admin_audit_logs_actor_user_id;
DROP INDEX IF EXISTS public.ix_admin_audit_logs_action;
DROP INDEX IF EXISTS public.ix_admin_audit_company_activity;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.recruitment_requests DROP CONSTRAINT IF EXISTS uq_recruitment_requests_converted_job_id;
ALTER TABLE IF EXISTS ONLY public.job_categories DROP CONSTRAINT IF EXISTS uq_job_categories_slug;
ALTER TABLE IF EXISTS ONLY public.job_categories DROP CONSTRAINT IF EXISTS uq_job_categories_name;
ALTER TABLE IF EXISTS ONLY public.job_assignments DROP CONSTRAINT IF EXISTS uq_job_assignment_membership;
ALTER TABLE IF EXISTS ONLY public.departments DROP CONSTRAINT IF EXISTS uq_department_company_name;
ALTER TABLE IF EXISTS ONLY public.company_memberships DROP CONSTRAINT IF EXISTS uq_company_membership_user;
ALTER TABLE IF EXISTS ONLY public.company_invitations DROP CONSTRAINT IF EXISTS uq_company_invitations_message_id;
ALTER TABLE IF EXISTS ONLY public.round_criteria_scores DROP CONSTRAINT IF EXISTS round_criteria_scores_pkey;
ALTER TABLE IF EXISTS ONLY public.resumes DROP CONSTRAINT IF EXISTS resumes_pkey;
ALTER TABLE IF EXISTS ONLY public.recruitment_requests DROP CONSTRAINT IF EXISTS recruitment_requests_pkey;
ALTER TABLE IF EXISTS ONLY public.oauth_accounts DROP CONSTRAINT IF EXISTS oauth_accounts_pkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_pkey;
ALTER TABLE IF EXISTS ONLY public.jobs DROP CONSTRAINT IF EXISTS jobs_pkey;
ALTER TABLE IF EXISTS ONLY public.job_categories DROP CONSTRAINT IF EXISTS job_categories_pkey;
ALTER TABLE IF EXISTS ONLY public.job_assignments DROP CONSTRAINT IF EXISTS job_assignments_pkey;
ALTER TABLE IF EXISTS ONLY public.interview_rounds DROP CONSTRAINT IF EXISTS interview_rounds_pkey;
ALTER TABLE IF EXISTS ONLY public.departments DROP CONSTRAINT IF EXISTS departments_pkey;
ALTER TABLE IF EXISTS ONLY public.cv_documents DROP CONSTRAINT IF EXISTS cv_documents_pkey;
ALTER TABLE IF EXISTS ONLY public.company_memberships DROP CONSTRAINT IF EXISTS company_memberships_pkey;
ALTER TABLE IF EXISTS ONLY public.company_invitations DROP CONSTRAINT IF EXISTS company_invitations_token_hash_key;
ALTER TABLE IF EXISTS ONLY public.company_invitations DROP CONSTRAINT IF EXISTS company_invitations_pkey;
ALTER TABLE IF EXISTS ONLY public.companies DROP CONSTRAINT IF EXISTS companies_pkey;
ALTER TABLE IF EXISTS ONLY public.assessment_attempts DROP CONSTRAINT IF EXISTS assessment_attempts_pkey;
ALTER TABLE IF EXISTS ONLY public.applications DROP CONSTRAINT IF EXISTS applications_pkey;
ALTER TABLE IF EXISTS ONLY public.alembic_version DROP CONSTRAINT IF EXISTS alembic_version_pkc;
ALTER TABLE IF EXISTS ONLY public.admin_audit_logs DROP CONSTRAINT IF EXISTS admin_audit_logs_pkey;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.round_criteria_scores ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.resumes ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.recruitment_requests ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.oauth_accounts ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.notifications ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.jobs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.job_categories ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.job_assignments ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.interview_rounds ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.departments ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.cv_documents ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.company_memberships ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.company_invitations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.companies ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.assessment_attempts ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.applications ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.admin_audit_logs ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP SEQUENCE IF EXISTS public.round_criteria_scores_id_seq;
DROP TABLE IF EXISTS public.round_criteria_scores;
DROP SEQUENCE IF EXISTS public.resumes_id_seq;
DROP TABLE IF EXISTS public.resumes;
DROP SEQUENCE IF EXISTS public.recruitment_requests_id_seq;
DROP TABLE IF EXISTS public.recruitment_requests;
DROP SEQUENCE IF EXISTS public.oauth_accounts_id_seq;
DROP TABLE IF EXISTS public.oauth_accounts;
DROP SEQUENCE IF EXISTS public.notifications_id_seq;
DROP TABLE IF EXISTS public.notifications;
DROP SEQUENCE IF EXISTS public.jobs_id_seq;
DROP TABLE IF EXISTS public.jobs;
DROP SEQUENCE IF EXISTS public.job_categories_id_seq;
DROP TABLE IF EXISTS public.job_categories;
DROP SEQUENCE IF EXISTS public.job_assignments_id_seq;
DROP TABLE IF EXISTS public.job_assignments;
DROP SEQUENCE IF EXISTS public.interview_rounds_id_seq;
DROP TABLE IF EXISTS public.interview_rounds;
DROP SEQUENCE IF EXISTS public.departments_id_seq;
DROP TABLE IF EXISTS public.departments;
DROP SEQUENCE IF EXISTS public.cv_documents_id_seq;
DROP TABLE IF EXISTS public.cv_documents;
DROP SEQUENCE IF EXISTS public.company_memberships_id_seq;
DROP TABLE IF EXISTS public.company_memberships;
DROP SEQUENCE IF EXISTS public.company_invitations_id_seq;
DROP TABLE IF EXISTS public.company_invitations;
DROP SEQUENCE IF EXISTS public.companies_id_seq;
DROP TABLE IF EXISTS public.companies;
DROP SEQUENCE IF EXISTS public.assessment_attempts_id_seq;
DROP TABLE IF EXISTS public.assessment_attempts;
DROP SEQUENCE IF EXISTS public.applications_id_seq;
DROP TABLE IF EXISTS public.applications;
DROP TABLE IF EXISTS public.alembic_version;
DROP SEQUENCE IF EXISTS public.admin_audit_logs_id_seq;
DROP TABLE IF EXISTS public.admin_audit_logs;
DROP TYPE IF EXISTS public.userrole;
DROP TYPE IF EXISTS public.recruitmentrequeststatus;
DROP TYPE IF EXISTS public.recruitmentpriority;
DROP TYPE IF EXISTS public.notificationtype;
DROP TYPE IF EXISTS public.membershipstatus;
DROP TYPE IF EXISTS public.membershiprole;
DROP TYPE IF EXISTS public.jobtype;
DROP TYPE IF EXISTS public.invitationstatus;
DROP TYPE IF EXISTS public.invitationdeliverystatus;
DROP TYPE IF EXISTS public.hiringrecommendation;
DROP TYPE IF EXISTS public.experiencelevel;
DROP TYPE IF EXISTS public.applicationstatus;
DROP EXTENSION IF EXISTS vector;
--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


--
-- Name: applicationstatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.applicationstatus AS ENUM (
    'pending',
    'reviewed',
    'shortlisted',
    'interview',
    'accepted',
    'rejected'
);


ALTER TYPE public.applicationstatus OWNER TO postgres;

--
-- Name: experiencelevel; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.experiencelevel AS ENUM (
    'fresher',
    'junior',
    'middle',
    'senior',
    'lead'
);


ALTER TYPE public.experiencelevel OWNER TO postgres;

--
-- Name: hiringrecommendation; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.hiringrecommendation AS ENUM (
    'recommended',
    'not_recommended',
    'needs_more_review'
);


ALTER TYPE public.hiringrecommendation OWNER TO postgres;

--
-- Name: invitationdeliverystatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.invitationdeliverystatus AS ENUM (
    'not_configured',
    'pending',
    'sent',
    'failed',
    'bounced'
);


ALTER TYPE public.invitationdeliverystatus OWNER TO postgres;

--
-- Name: invitationstatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.invitationstatus AS ENUM (
    'pending',
    'accepted',
    'declined',
    'revoked',
    'expired'
);


ALTER TYPE public.invitationstatus OWNER TO postgres;

--
-- Name: jobtype; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.jobtype AS ENUM (
    'full_time',
    'part_time',
    'internship',
    'freelance',
    'remote'
);


ALTER TYPE public.jobtype OWNER TO postgres;

--
-- Name: membershiprole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.membershiprole AS ENUM (
    'hr',
    'department_head'
);


ALTER TYPE public.membershiprole OWNER TO postgres;

--
-- Name: membershipstatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.membershipstatus AS ENUM (
    'active',
    'suspended',
    'revoked'
);


ALTER TYPE public.membershipstatus OWNER TO postgres;

--
-- Name: notificationtype; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.notificationtype AS ENUM (
    'application_update',
    'new_job_match',
    'system'
);


ALTER TYPE public.notificationtype OWNER TO postgres;

--
-- Name: recruitmentpriority; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.recruitmentpriority AS ENUM (
    'low',
    'normal',
    'high',
    'urgent'
);


ALTER TYPE public.recruitmentpriority OWNER TO postgres;

--
-- Name: recruitmentrequeststatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.recruitmentrequeststatus AS ENUM (
    'draft',
    'submitted',
    'approved',
    'rejected',
    'cancelled'
);


ALTER TYPE public.recruitmentrequeststatus OWNER TO postgres;

--
-- Name: userrole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.userrole AS ENUM (
    'candidate',
    'employer',
    'admin'
);


ALTER TYPE public.userrole OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_audit_logs (
    id integer NOT NULL,
    actor_user_id integer,
    actor_email character varying(255) NOT NULL,
    action character varying(100) NOT NULL,
    target_type character varying(50) NOT NULL,
    target_id character varying(64),
    target_label character varying(255),
    details_json json NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    company_id integer
);


ALTER TABLE public.admin_audit_logs OWNER TO postgres;

--
-- Name: admin_audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admin_audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admin_audit_logs_id_seq OWNER TO postgres;

--
-- Name: admin_audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admin_audit_logs_id_seq OWNED BY public.admin_audit_logs.id;


--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO postgres;

--
-- Name: applications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.applications (
    id integer NOT NULL,
    cover_letter text,
    status public.applicationstatus DEFAULT 'pending'::public.applicationstatus NOT NULL,
    ai_matching_score double precision,
    ai_feedback text,
    candidate_id integer NOT NULL,
    job_id integer NOT NULL,
    resume_id integer,
    applied_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    cv_document_id integer,
    hiring_recommendation public.hiringrecommendation,
    recommendation_note text,
    recommendation_by_id integer,
    recommended_at timestamp with time zone,
    decision_by_id integer,
    decided_at timestamp with time zone,
    decision_reason text
);


ALTER TABLE public.applications OWNER TO postgres;

--
-- Name: applications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.applications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.applications_id_seq OWNER TO postgres;

--
-- Name: applications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.applications_id_seq OWNED BY public.applications.id;


--
-- Name: assessment_attempts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assessment_attempts (
    id integer NOT NULL,
    user_id integer NOT NULL,
    assessment_type character varying(20) NOT NULL,
    questionnaire_version character varying(30) NOT NULL,
    answers_json json NOT NULL,
    result_code character varying(30) NOT NULL,
    result_json json NOT NULL,
    completed_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.assessment_attempts OWNER TO postgres;

--
-- Name: assessment_attempts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assessment_attempts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assessment_attempts_id_seq OWNER TO postgres;

--
-- Name: assessment_attempts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assessment_attempts_id_seq OWNED BY public.assessment_attempts.id;


--
-- Name: companies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.companies (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    logo_url character varying(500),
    is_active boolean DEFAULT true NOT NULL,
    created_by_user_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    website character varying(500),
    address text,
    tax_code character varying(50),
    industry character varying(200),
    company_size character varying(100),
    social_links json,
    contact_person_name character varying(255),
    contact_person_email character varying(255),
    contact_person_phone character varying(50)
);


ALTER TABLE public.companies OWNER TO postgres;

--
-- Name: companies_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.companies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.companies_id_seq OWNER TO postgres;

--
-- Name: companies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.companies_id_seq OWNED BY public.companies.id;


--
-- Name: company_invitations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.company_invitations (
    id integer NOT NULL,
    company_id integer NOT NULL,
    email character varying(255) NOT NULL,
    member_role public.membershiprole NOT NULL,
    department_id integer,
    status public.invitationstatus DEFAULT 'pending'::public.invitationstatus NOT NULL,
    token_hash character varying(64) NOT NULL,
    invited_by integer NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    accepted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    delivery_status public.invitationdeliverystatus DEFAULT 'not_configured'::public.invitationdeliverystatus NOT NULL,
    delivery_attempts integer DEFAULT 0 NOT NULL,
    message_id character varying(255),
    delivery_error text,
    sent_at timestamp with time zone,
    bounced_at timestamp with time zone
);


ALTER TABLE public.company_invitations OWNER TO postgres;

--
-- Name: company_invitations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.company_invitations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.company_invitations_id_seq OWNER TO postgres;

--
-- Name: company_invitations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.company_invitations_id_seq OWNED BY public.company_invitations.id;


--
-- Name: company_memberships; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.company_memberships (
    id integer NOT NULL,
    company_id integer NOT NULL,
    user_id integer NOT NULL,
    member_role public.membershiprole NOT NULL,
    department_id integer,
    status public.membershipstatus DEFAULT 'active'::public.membershipstatus NOT NULL,
    is_owner boolean DEFAULT false NOT NULL,
    invited_by integer,
    membership_version integer DEFAULT 1 NOT NULL,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.company_memberships OWNER TO postgres;

--
-- Name: company_memberships_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.company_memberships_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.company_memberships_id_seq OWNER TO postgres;

--
-- Name: company_memberships_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.company_memberships_id_seq OWNED BY public.company_memberships.id;


--
-- Name: cv_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cv_documents (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title character varying(255) DEFAULT 'CV của tôi'::character varying NOT NULL,
    template_key character varying(64) DEFAULT 'ats-minimal'::character varying NOT NULL,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    content_json json NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.cv_documents OWNER TO postgres;

--
-- Name: cv_documents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cv_documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cv_documents_id_seq OWNER TO postgres;

--
-- Name: cv_documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cv_documents_id_seq OWNED BY public.cv_documents.id;


--
-- Name: departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departments (
    id integer NOT NULL,
    company_id integer NOT NULL,
    name character varying(150) NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.departments OWNER TO postgres;

--
-- Name: departments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.departments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.departments_id_seq OWNER TO postgres;

--
-- Name: departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.departments_id_seq OWNED BY public.departments.id;


--
-- Name: interview_rounds; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.interview_rounds (
    id integer NOT NULL,
    application_id integer NOT NULL,
    round_number integer NOT NULL,
    round_type character varying(50) DEFAULT 'custom'::character varying NOT NULL,
    round_name character varying(255),
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    scheduled_at timestamp with time zone,
    location character varying(500),
    notes text,
    reviewer_id integer,
    score integer,
    feedback text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    needs_review boolean DEFAULT false NOT NULL,
    review_reason text,
    marked_by_admin_id integer
);


ALTER TABLE public.interview_rounds OWNER TO postgres;

--
-- Name: interview_rounds_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.interview_rounds_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.interview_rounds_id_seq OWNER TO postgres;

--
-- Name: interview_rounds_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.interview_rounds_id_seq OWNED BY public.interview_rounds.id;


--
-- Name: job_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.job_assignments (
    id integer NOT NULL,
    job_id integer NOT NULL,
    membership_id integer NOT NULL,
    assigned_by integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.job_assignments OWNER TO postgres;

--
-- Name: job_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.job_assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.job_assignments_id_seq OWNER TO postgres;

--
-- Name: job_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.job_assignments_id_seq OWNED BY public.job_assignments.id;


--
-- Name: job_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.job_categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL
);


ALTER TABLE public.job_categories OWNER TO postgres;

--
-- Name: job_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.job_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.job_categories_id_seq OWNER TO postgres;

--
-- Name: job_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.job_categories_id_seq OWNED BY public.job_categories.id;


--
-- Name: jobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.jobs (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    requirements text,
    benefits text,
    job_type public.jobtype DEFAULT 'full_time'::public.jobtype NOT NULL,
    experience_level public.experiencelevel DEFAULT 'fresher'::public.experiencelevel NOT NULL,
    salary_min integer,
    salary_max integer,
    location character varying(255),
    is_active boolean DEFAULT true NOT NULL,
    employer_id integer NOT NULL,
    category_id integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    embedding public.vector(384),
    company_id integer,
    department_id integer
);


ALTER TABLE public.jobs OWNER TO postgres;

--
-- Name: jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.jobs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.jobs_id_seq OWNER TO postgres;

--
-- Name: jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.jobs_id_seq OWNED BY public.jobs.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    type public.notificationtype DEFAULT 'system'::public.notificationtype NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    user_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: oauth_accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.oauth_accounts (
    id integer NOT NULL,
    user_id integer NOT NULL,
    provider character varying(50) NOT NULL,
    provider_user_id character varying(255) NOT NULL,
    email character varying(255),
    access_token text,
    id_token text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.oauth_accounts OWNER TO postgres;

--
-- Name: oauth_accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.oauth_accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oauth_accounts_id_seq OWNER TO postgres;

--
-- Name: oauth_accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.oauth_accounts_id_seq OWNED BY public.oauth_accounts.id;


--
-- Name: recruitment_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recruitment_requests (
    id integer NOT NULL,
    company_id integer NOT NULL,
    department_id integer NOT NULL,
    requested_by_id integer NOT NULL,
    title character varying(255) NOT NULL,
    headcount integer DEFAULT 1 NOT NULL,
    job_type public.jobtype DEFAULT 'full_time'::public.jobtype NOT NULL,
    priority public.recruitmentpriority DEFAULT 'normal'::public.recruitmentpriority NOT NULL,
    reason text NOT NULL,
    responsibilities text NOT NULL,
    requirements text NOT NULL,
    target_start_date date,
    status public.recruitmentrequeststatus DEFAULT 'draft'::public.recruitmentrequeststatus NOT NULL,
    review_note text,
    reviewed_by_id integer,
    submitted_at timestamp with time zone,
    reviewed_at timestamp with time zone,
    cancelled_at timestamp with time zone,
    converted_job_id integer,
    converted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.recruitment_requests OWNER TO postgres;

--
-- Name: recruitment_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.recruitment_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.recruitment_requests_id_seq OWNER TO postgres;

--
-- Name: recruitment_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.recruitment_requests_id_seq OWNED BY public.recruitment_requests.id;


--
-- Name: resumes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.resumes (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    file_url character varying(500),
    raw_text text,
    parsed_skills text,
    parsed_experience text,
    embedding public.vector(384),
    user_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    ai_evaluation_json text
);


ALTER TABLE public.resumes OWNER TO postgres;

--
-- Name: resumes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.resumes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.resumes_id_seq OWNER TO postgres;

--
-- Name: resumes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.resumes_id_seq OWNED BY public.resumes.id;


--
-- Name: round_criteria_scores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.round_criteria_scores (
    id integer NOT NULL,
    round_id integer NOT NULL,
    criteria_name character varying(255) NOT NULL,
    score integer NOT NULL,
    notes text,
    CONSTRAINT ck_criteria_score_range CHECK (((score >= 0) AND (score <= 10)))
);


ALTER TABLE public.round_criteria_scores OWNER TO postgres;

--
-- Name: round_criteria_scores_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.round_criteria_scores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.round_criteria_scores_id_seq OWNER TO postgres;

--
-- Name: round_criteria_scores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.round_criteria_scores_id_seq OWNED BY public.round_criteria_scores.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    hashed_password character varying(255) NOT NULL,
    full_name character varying(255) NOT NULL,
    role public.userrole DEFAULT 'candidate'::public.userrole NOT NULL,
    avatar_url character varying(500),
    phone character varying(20),
    is_active boolean DEFAULT true NOT NULL,
    company_name character varying(255),
    company_logo_url character varying(500),
    company_description character varying,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: admin_audit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_audit_logs ALTER COLUMN id SET DEFAULT nextval('public.admin_audit_logs_id_seq'::regclass);


--
-- Name: applications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications ALTER COLUMN id SET DEFAULT nextval('public.applications_id_seq'::regclass);


--
-- Name: assessment_attempts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_attempts ALTER COLUMN id SET DEFAULT nextval('public.assessment_attempts_id_seq'::regclass);


--
-- Name: companies id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies ALTER COLUMN id SET DEFAULT nextval('public.companies_id_seq'::regclass);


--
-- Name: company_invitations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_invitations ALTER COLUMN id SET DEFAULT nextval('public.company_invitations_id_seq'::regclass);


--
-- Name: company_memberships id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_memberships ALTER COLUMN id SET DEFAULT nextval('public.company_memberships_id_seq'::regclass);


--
-- Name: cv_documents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cv_documents ALTER COLUMN id SET DEFAULT nextval('public.cv_documents_id_seq'::regclass);


--
-- Name: departments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments ALTER COLUMN id SET DEFAULT nextval('public.departments_id_seq'::regclass);


--
-- Name: interview_rounds id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interview_rounds ALTER COLUMN id SET DEFAULT nextval('public.interview_rounds_id_seq'::regclass);


--
-- Name: job_assignments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_assignments ALTER COLUMN id SET DEFAULT nextval('public.job_assignments_id_seq'::regclass);


--
-- Name: job_categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_categories ALTER COLUMN id SET DEFAULT nextval('public.job_categories_id_seq'::regclass);


--
-- Name: jobs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs ALTER COLUMN id SET DEFAULT nextval('public.jobs_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: oauth_accounts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.oauth_accounts ALTER COLUMN id SET DEFAULT nextval('public.oauth_accounts_id_seq'::regclass);


--
-- Name: recruitment_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruitment_requests ALTER COLUMN id SET DEFAULT nextval('public.recruitment_requests_id_seq'::regclass);


--
-- Name: resumes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resumes ALTER COLUMN id SET DEFAULT nextval('public.resumes_id_seq'::regclass);


--
-- Name: round_criteria_scores id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.round_criteria_scores ALTER COLUMN id SET DEFAULT nextval('public.round_criteria_scores_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: admin_audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin_audit_logs (id, actor_user_id, actor_email, action, target_type, target_id, target_label, details_json, created_at, company_id) FROM stdin;
243	532	admin@jobportal.vn	SYSTEM_INIT	system	1	Hệ thống AI Job Portal	{"message": "Kh\\u1edfi t\\u1ea1o n\\u1ec1n t\\u1ea3ng tuy\\u1ec3n d\\u1ee5ng AI Job Portal phi\\u00ean b\\u1ea3n Enterprise."}	2026-08-17 13:24:26.319653+00	\N
244	533	employer@techcorp.vn	JOB_CREATE	job	206	Senior Fullstack Engineer (React 19 & Python FastAPI)	{"message": "\\u0110\\u0103ng tin tuy\\u1ec3n d\\u1ee5ng 'Senior Fullstack Engineer (React 19 & Python FastAPI)'."}	2026-08-17 13:24:26.319653+00	234
245	533	employer@techcorp.vn	AI_MATCH_RUN	application	1	Ứng viên Nguyễn Văn An	{"score": 94.5, "message": "Ch\\u1ea1y thu\\u1eadt to\\u00e1n Cosine Similarity AI Matching cho h\\u1ed3 s\\u01a1 \\u1ee9ng vi\\u00ean Nguy\\u1ec5n V\\u0103n An."}	2026-08-17 13:24:26.319653+00	234
\.


--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alembic_version (version_num) FROM stdin;
015
\.


--
-- Data for Name: applications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.applications (id, cover_letter, status, ai_matching_score, ai_feedback, candidate_id, job_id, resume_id, applied_at, updated_at, cv_document_id, hiring_recommendation, recommendation_note, recommendation_by_id, recommended_at, decision_by_id, decided_at, decision_reason) FROM stdin;
165	Kính gửi Quý công ty TechCorp Vietnam, Tôi là Nguyễn Văn An, kính nộp hồ sơ ứng tuyển vị trí Senior Fullstack Engineer (React 19 & Python FastAPI). Với kinh nghiệm và thế mạnh về React, TypeScript, FastAPI, tôi tin mình sẽ đóng góp xuất sắc cho công ty.	interview	94.5	Hồ sơ xuất sắc (94.5%). Điểm mạnh nổi trội về React, TypeScript và FastAPI. Khả năng thiết kế hệ thống tốt.	535	206	97	2026-08-05 13:24:24.699357+00	2026-08-17 13:24:24.693703+00	\N	recommended	Ứng viên có kiến trúc phần mềm tốt, kỹ năng fullstack vững vàng và phù hợp cao với văn hóa đội ngũ.	534	2026-08-15 13:24:24.709862+00	\N	\N	\N
166	Kính gửi Quý công ty TechCorp Vietnam, Tôi là Lê Thị Mai, kính nộp hồ sơ ứng tuyển vị trí AI & Data Engineer (LLM / RAG / pgvector). Với kinh nghiệm và thế mạnh về Python, PyTorch, pgvector, tôi tin mình sẽ đóng góp xuất sắc cho công ty.	shortlisted	91	Khớp 91% yêu cầu JD. Điểm mạnh về Python, Vector Database và mô hình ngôn ngữ lớn.	536	207	98	2026-08-06 13:24:24.716825+00	2026-08-17 13:24:24.693703+00	\N	recommended	Kinh nghiệm về RAG và vector embeddings rất thực chiến.	534	2026-08-15 13:24:24.941183+00	\N	\N	\N
167	Kính gửi Quý công ty TechCorp Vietnam, Tôi là Trần Quốc Huy, kính nộp hồ sơ ứng tuyển vị trí Lead Product Designer (UI/UX B2B SaaS). Với kinh nghiệm và thế mạnh về Figma, Design System, UI/UX, tôi tin mình sẽ đóng góp xuất sắc cho công ty.	reviewed	88	Khớp 88% yêu cầu. Kinh nghiệm dày dặn về thiết kế Design System và tối ưu trải nghiệm B2B.	537	208	99	2026-08-07 13:24:24.942604+00	2026-08-17 13:24:24.693703+00	\N	recommended	Portfolio B2B SaaS rất ấn tượng, visual sạch sẽ.	534	2026-08-15 13:24:25.161373+00	\N	\N	\N
168	Kính gửi Quý công ty TechCorp Vietnam, Tôi là Phạm Minh Khoa, kính nộp hồ sơ ứng tuyển vị trí DevOps & Cloud Infrastructure Engineer. Với kinh nghiệm và thế mạnh về Kubernetes, Docker, AWS, tôi tin mình sẽ đóng góp xuất sắc cho công ty.	accepted	96	Đạt điểm khớp tuyệt đối 96%. Thành thạo hạ tầng đám mây và tự động hóa quy trình CI/CD.	538	209	100	2026-08-08 13:24:25.1623+00	2026-08-17 13:24:24.693703+00	\N	recommended	Chuyên gia DevOps hàng đầu, có chứng chỉ CKA và AWS Solutions Architect.	534	2026-08-15 13:24:25.37955+00	\N	\N	\N
169	Kính gửi Quý công ty TechCorp Vietnam, Tôi là Hoàng Thu Trang, kính nộp hồ sơ ứng tuyển vị trí Frontend React Developer (TypeScript / Tailwind). Với kinh nghiệm và thế mạnh về React, JavaScript, CSS3, tôi tin mình sẽ đóng góp xuất sắc cho công ty.	pending	82.5	Khớp 82.5% với vị trí Junior Frontend. Nền tảng CSS/HTML vững và thao tác React tốt.	539	210	101	2026-08-09 13:24:25.382569+00	2026-08-17 13:24:24.693703+00	\N	needs_more_review	Ứng viên tiềm năng, cần kiểm tra thêm khả năng giải quyết thuật toán.	534	2026-08-15 13:24:25.598552+00	\N	\N	\N
171	Kính gửi Quý công ty TechCorp Vietnam, Tôi là Đoàn Ngọc Linh, kính nộp hồ sơ ứng tuyển vị trí Lead Product Designer (UI/UX B2B SaaS). Với kinh nghiệm và thế mạnh về Figma, UI Design, Mobile UI, tôi tin mình sẽ đóng góp xuất sắc cho công ty.	shortlisted	85	Khớp 85% vị trí Product Designer. Thế mạnh về giao diện ứng dụng di động.	541	208	103	2026-08-11 13:24:25.834617+00	2026-08-17 13:24:24.693703+00	\N	recommended	Thiết kế mobile app rất tinh tế, tư duy màu sắc tốt.	534	2026-08-15 13:24:26.056388+00	\N	\N	\N
172	Kính gửi Quý công ty TechCorp Vietnam, Tôi là Đặng Tuấn Kiệt, kính nộp hồ sơ ứng tuyển vị trí DevOps & Cloud Infrastructure Engineer. Với kinh nghiệm và thế mạnh về Linux, Bash, Docker, tôi tin mình sẽ đóng góp xuất sắc cho công ty.	rejected	62	Độ tương thích 62%. Chưa đáp ứng đủ yêu cầu chuyên sâu về Kubernetes và Terraform.	542	209	104	2026-08-12 13:24:26.057224+00	2026-08-17 13:24:24.693703+00	\N	not_recommended	Chưa có kinh nghiệm thực tế với Kubernetes và hạ tầng đám mây AWS.	\N	2026-08-15 13:24:26.299622+00	\N	\N	\N
170	Kính gửi Quý công ty TechCorp Vietnam, Tôi là Vũ Đức Thắng, kính nộp hồ sơ ứng tuyển vị trí Senior Fullstack Engineer (React 19 & Python FastAPI). Với kinh nghiệm và thế mạnh về Python, FastAPI, React, tôi tin mình sẽ đóng góp xuất sắc cho công ty.	shortlisted	79	Độ tương thích 79%. Có kinh nghiệm xây dựng API nhưng cần nâng cao kỹ năng TypeScript.	540	206	102	2026-08-10 13:24:25.599411+00	2026-08-17 13:34:21.096983+00	\N	needs_more_review	Cần phỏng vấn thêm về kiến trúc Microservices.	534	2026-08-15 13:24:25.829907+00	\N	\N	\N
173	Kính gửi TechCorp VN, Tôi là Nguyễn Văn An, xin nộp hồ sơ ứng tuyển vị trí Senior Fullstack Engineer (React 19 & Python FastAPI).	interview	96.5	Ứng viên có độ tương thích cao (96.5%) với vị trí Senior Fullstack Engineer (React 19 & Python FastAPI). Điểm mạnh về React và kinh nghiệm thực chiến.	544	206	105	2026-08-18 12:28:21.59591+00	2026-08-19 12:28:21.3593+00	\N	recommended	\N	\N	\N	\N	\N	\N
174	Kính gửi TechCorp VN, Tôi là Trần Quốc Huy, xin nộp hồ sơ ứng tuyển vị trí DevOps & Cloud Infrastructure Engineer.	reviewed	88.5	Ứng viên có độ tương thích cao (88.5%) với vị trí DevOps & Cloud Infrastructure Engineer. Điểm mạnh về UI/UX và kinh nghiệm thực chiến.	537	209	99	2026-08-14 12:28:21.612672+00	2026-08-19 12:28:21.3593+00	\N	recommended	\N	\N	\N	\N	\N	\N
175	Kính gửi TechCorp VN, Tôi là Phạm Minh Khoa, xin nộp hồ sơ ứng tuyển vị trí Lead Product Designer (UI/UX B2B SaaS).	accepted	85	Ứng viên có độ tương thích cao (85.0%) với vị trí Lead Product Designer (UI/UX B2B SaaS). Điểm mạnh về Kubernetes và kinh nghiệm thực chiến.	538	208	100	2026-08-12 12:28:21.619991+00	2026-08-19 12:28:21.3593+00	\N	recommended	\N	\N	\N	\N	\N	\N
176	Kính gửi TechCorp VN, Tôi là Đoàn Ngọc Linh, xin nộp hồ sơ ứng tuyển vị trí AI & Data Engineer (LLM / RAG / pgvector).	shortlisted	74	Ứng viên có độ tương thích cao (74.0%) với vị trí AI & Data Engineer (LLM / RAG / pgvector). Điểm mạnh về Product Design và kinh nghiệm thực chiến.	541	207	103	2026-08-06 12:28:21.628627+00	2026-08-19 12:28:21.3593+00	\N	needs_more_review	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: assessment_attempts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assessment_attempts (id, user_id, assessment_type, questionnaire_version, answers_json, result_code, result_json, completed_at, created_at) FROM stdin;
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.companies (id, name, description, logo_url, is_active, created_by_user_id, created_at, updated_at, website, address, tax_code, industry, company_size, social_links, contact_person_name, contact_person_email, contact_person_phone) FROM stdin;
234	TechCorp Vietnam	Tập đoàn công nghệ và giải pháp phần mềm hàng đầu tại Việt Nam, chuyên cung cấp các giải pháp AI B2B SaaS, Chuyển đổi số và Điện toán đám mây cho thị trường trong nước và quốc tế.	\N	t	533	2026-08-17 13:24:24.653612+00	2026-08-17 13:24:24.653612+00	https://techcorp.vn	Tầng 28, Tòa nhà Keangnam Landmark 72, Phạm Hùng, Nam Từ Liêm, Hà Nội	0108998877	Công nghệ thông tin & Trí tuệ nhân tạo (AI)	100 - 500 nhân sự	\N	Trần Thị Mai	recruitment@techcorp.vn	0901234567
\.


--
-- Data for Name: company_invitations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.company_invitations (id, company_id, email, member_role, department_id, status, token_hash, invited_by, expires_at, accepted_at, created_at, updated_at, delivery_status, delivery_attempts, message_id, delivery_error, sent_at, bounced_at) FROM stdin;
\.


--
-- Data for Name: company_memberships; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.company_memberships (id, company_id, user_id, member_role, department_id, status, is_owner, invited_by, membership_version, joined_at, created_at, updated_at) FROM stdin;
252	234	533	hr	\N	active	t	\N	1	2026-08-17 13:24:24.653612+00	2026-08-17 13:24:24.653612+00	2026-08-17 13:24:24.653612+00
253	234	534	department_head	22	active	f	\N	1	2026-08-17 13:24:24.653612+00	2026-08-17 13:24:24.653612+00	2026-08-17 13:24:24.653612+00
\.


--
-- Data for Name: cv_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cv_documents (id, user_id, title, template_key, status, content_json, created_at, updated_at) FROM stdin;
36	535	CV Chuyên Nghiệp - Nguyễn Văn An	ats-minimal	published	{"version": 1, "personal": {"full_name": "Nguy\\u1ec5n V\\u0103n An", "email": "candidate@jobportal.vn", "phone": "0912345678", "title": "Senior Fullstack Software Engineer", "summary": "K\\u1ef9 s\\u01b0 ph\\u1ea7n m\\u1ec1m Fullstack v\\u1edbi 4+ n\\u0103m kinh nghi\\u1ec7m ph\\u00e1t tri\\u1ec3n \\u1ee9ng d\\u1ee5ng web quy m\\u00f4 l\\u1edbn b\\u1eb1ng React, TypeScript, FastAPI v\\u00e0 PostgreSQL.", "location": "H\\u00e0 N\\u1ed9i, Vi\\u1ec7t Nam"}, "experiences": [{"company": "VNG Corporation", "position": "Senior Software Engineer", "start_date": "2023-01", "end_date": "2026-06", "description": "Ki\\u1ebfn tr\\u00fac h\\u1ec7 th\\u1ed1ng Microservices ph\\u1ee5c v\\u1ee5 2 tri\\u1ec7u ng\\u01b0\\u1eddi d\\u00f9ng h\\u00e0ng ng\\u00e0y. T\\u1ed1i \\u01b0u h\\u00f3a API response time gi\\u1ea3m 40%."}], "skills": ["React", "TypeScript", "Python", "FastAPI", "PostgreSQL", "pgvector", "Docker", "Tailwind CSS"], "educations": [{"school": "\\u0110\\u1ea1i h\\u1ecdc B\\u00e1ch Khoa H\\u00e0 N\\u1ed9i", "degree": "K\\u1ef9 s\\u01b0 C\\u00f4ng ngh\\u1ec7 Th\\u00f4ng tin", "start_date": "2018", "end_date": "2022"}]}	2026-08-17 13:24:24.693703+00	2026-08-17 13:24:24.693703+00
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.departments (id, company_id, name, description, is_active, created_at, updated_at) FROM stdin;
22	234	Phòng Kỹ thuật & Công nghệ (Engineering)	Phụ trách kiến trúc hệ thống, phát triển Backend, Frontend, AI/ML và Hạ tầng Cloud.	t	2026-08-17 13:24:24.653612+00	2026-08-17 13:24:24.653612+00
23	234	Phòng Thiết kế & Sản phẩm (Product & Design)	Chịu trách nhiệm nghiên cứu người dùng, thiết kế UI/UX và quản trị sản phẩm.	t	2026-08-17 13:24:24.653612+00	2026-08-17 13:24:24.653612+00
\.


--
-- Data for Name: interview_rounds; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.interview_rounds (id, application_id, round_number, round_type, round_name, status, scheduled_at, location, notes, reviewer_id, score, feedback, created_at, updated_at, needs_review, review_reason, marked_by_admin_id) FROM stdin;
211	165	1	cv_screen	1. Sàng lọc hồ sơ CV	passed	2026-08-06 13:24:24.699357+00	\N	\N	\N	9	\N	2026-08-17 13:24:24.693703+00	2026-08-17 13:24:24.693703+00	f	\N	\N
212	165	2	tech	2. Phỏng vấn Kỹ thuật	in_progress	2026-08-18 13:24:24.713824+00	\N	\N	534	8	\N	2026-08-17 13:24:24.693703+00	2026-08-17 13:24:24.693703+00	f	\N	\N
213	166	1	cv_screen	1. Sàng lọc hồ sơ CV	passed	2026-08-07 13:24:24.716825+00	\N	\N	\N	8	\N	2026-08-17 13:24:24.693703+00	2026-08-17 13:24:24.693703+00	f	\N	\N
214	167	1	cv_screen	1. Sàng lọc hồ sơ CV	passed	2026-08-08 13:24:24.942604+00	\N	\N	\N	8	\N	2026-08-17 13:24:24.693703+00	2026-08-17 13:24:24.693703+00	f	\N	\N
215	168	1	cv_screen	1. Sàng lọc hồ sơ CV	passed	2026-08-09 13:24:25.1623+00	\N	\N	\N	9	\N	2026-08-17 13:24:24.693703+00	2026-08-17 13:24:24.693703+00	f	\N	\N
216	168	2	tech	2. Phỏng vấn Kỹ thuật	passed	2026-08-11 13:24:25.1623+00	\N	\N	534	9	\N	2026-08-17 13:24:24.693703+00	2026-08-17 13:24:24.693703+00	f	\N	\N
217	168	3	hr	3. Phỏng vấn Văn hóa & HR	passed	2026-08-13 13:24:25.1623+00	\N	\N	533	9	\N	2026-08-17 13:24:24.693703+00	2026-08-17 13:24:24.693703+00	f	\N	\N
218	168	4	final	4. Offer & Trúng tuyển	passed	2026-08-15 13:24:25.1623+00	\N	\N	\N	10	\N	2026-08-17 13:24:24.693703+00	2026-08-17 13:24:24.693703+00	f	\N	\N
219	170	1	cv_screen	1. Sàng lọc hồ sơ CV	passed	2026-08-11 13:24:25.599411+00	\N	\N	\N	9	\N	2026-08-17 13:24:24.693703+00	2026-08-17 13:24:24.693703+00	f	\N	\N
221	171	1	cv_screen	1. Sàng lọc hồ sơ CV	passed	2026-08-12 13:24:25.834617+00	\N	\N	\N	8	\N	2026-08-17 13:24:24.693703+00	2026-08-17 13:24:24.693703+00	f	\N	\N
220	170	2	tech	2. Phỏng vấn Kỹ thuật	passed	2026-08-18 13:24:25.833008+00	\N	\N	533	9	\N	2026-08-17 13:24:24.693703+00	2026-08-17 13:34:21.084145+00	f	\N	\N
222	170	3	final	Vòng 3: final	pending	\N	\N	\N	533	5	\N	2026-08-17 13:34:42.93336+00	2026-08-17 13:34:47.922443+00	f	\N	\N
223	173	1	tech	Phỏng vấn Kỹ thuật Chuyên sâu	in_progress	\N	\N	\N	\N	\N	\N	2026-08-19 12:28:21.3593+00	2026-08-19 12:28:21.3593+00	f	\N	\N
224	175	1	tech	Phỏng vấn Kỹ thuật Chuyên sâu	passed	\N	\N	\N	\N	\N	\N	2026-08-19 12:28:21.3593+00	2026-08-19 12:28:21.3593+00	f	\N	\N
\.


--
-- Data for Name: job_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.job_assignments (id, job_id, membership_id, assigned_by, created_at) FROM stdin;
\.


--
-- Data for Name: job_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.job_categories (id, name, slug) FROM stdin;
30	Công nghệ thông tin & Phần mềm	it-phan-mem
31	Trí tuệ nhân tạo & Dữ liệu	ai-data
32	Thiết kế UI/UX & Đồ họa	design-ui-ux
33	DevOps, Cloud & Hạ tầng	devops-cloud
34	Kinh doanh & Tiếp thị số	marketing-sales
\.


--
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.jobs (id, title, description, requirements, benefits, job_type, experience_level, salary_min, salary_max, location, is_active, employer_id, category_id, created_at, updated_at, embedding, company_id, department_id) FROM stdin;
206	Senior Fullstack Engineer (React 19 & Python FastAPI)	Chịu trách nhiệm thiết kế kiến trúc và phát triển hệ thống nền tảng AI Job Portal. Xây dựng các module AI Matching, phễu tuyển dụng Kanban, tối ưu hóa truy vấn Vector Database và đảm bảo tính mở rộng cao.	3+ năm kinh nghiệm với React, TypeScript và Python FastAPI. Thành thạo Tailwind CSS, PostgreSQL, Docker. Hiểu biết về Sentence Transformers hoặc pgvector là lợi thế lớn.	Thu nhập 35 - 60 triệu VNĐ, thưởng dự án theo quý, trang bị MacBook Pro M3, bảo hiểm sức khỏe VIP toàn diện.	full_time	senior	35000000	60000000	Hà Nội / Hybrid	t	533	30	2026-08-17 13:24:24.671926+00	2026-08-21 06:32:59.596003+00	[0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035]	234	22
207	AI & Data Engineer (LLM / RAG / pgvector)	Nghiên cứu, tinh chỉnh và triển khai các mô hình AI Matching, RAG Retrieval, CV Parser trên nền tảng DeepSeek API, PyTorch và FastAPI. Xây dựng pipeline kiểm soát thiên lệch AI (Bias-free AI).	Kinh nghiệm thực chiến với Vector Database (pgvector, Milvus), Prompt Engineering, Fine-tuning LLM, Python, PyTorch, FastAPI.	Thu nhập 45 - 75 triệu VNĐ, cổ phần ESOP thưởng, tài trợ 100% chi phí tham dự hội thảo công nghệ quốc tế.	full_time	senior	45000000	75000000	TP. Hồ Chí Minh / Remote	t	533	31	2026-08-17 13:24:24.671926+00	2026-08-21 06:32:59.596003+00	[0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035]	234	22
209	DevOps & Cloud Infrastructure Engineer	Quản trị hạ tầng đám mây AWS/GCP, thiết lập CI/CD pipelines tự động, quản lý Kubernetes cluster, triển khai pgvector và giám sát hệ thống với Prometheus/Grafana.	Kinh nghiệm vững vàng với Kubernetes, Docker, Terraform, GitLab CI/CD, Nginx và bảo mật mạng đám mây.	Thu nhập 32 - 55 triệu VNĐ, gói tài trợ thi chứng chỉ AWS/CKA không giới hạn, chế độ làm việc linh hoạt WFH.	full_time	middle	32000000	55000000	Đà Nẵng / Remote	t	533	33	2026-08-17 13:24:24.671926+00	2026-08-21 06:32:59.596003+00	[0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035]	234	22
208	Lead Product Designer (UI/UX B2B SaaS)	Chủ trì thiết kế trải nghiệm người dùng cho hệ thống B2B SaaS, xây dựng Design System chuẩn mực, thiết kế luồng quản trị phễu tuyển dụng và dashboard phân tích thông minh.	3+ năm kinh nghiệm thiết kế UI/UX cho sản phẩm B2B Web/Mobile. Thành thạo Figma, Design Tokens, Micro-interactions và User Research.	Thu nhập 30 - 50 triệu VNĐ, môi trường sáng tạo cởi mở, lộ trình thăng tiến rõ ràng lên vị trí Giám đốc Thiết kế.	full_time	lead	30000000	50000000	Hà Nội	t	533	32	2026-08-17 13:24:24.671926+00	2026-08-21 06:32:59.596003+00	[0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035]	234	23
210	Frontend React Developer (TypeScript / Tailwind)	Phát triển các component giao diện người dùng tương tác cao, kết nối RESTful API, tối ưu hóa tốc độ tải trang và trải nghiệm người dùng trên đa thiết bị.	1 - 3 năm kinh nghiệm với React, TypeScript, Tailwind CSS, Zustand/Redux. Tư duy thẩm mỹ tốt và chú trọng chi tiết.	Thu nhập 18 - 32 triệu VNĐ, đào tạo chuyên sâu bởi các Tech Lead hàng đầu, tham gia các dự án cốt lõi.	full_time	junior	18000000	32000000	Hà Nội	t	533	30	2026-08-17 13:24:24.671926+00	2026-08-21 06:32:59.596003+00	[0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035]	234	22
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, title, message, type, is_read, user_id, created_at) FROM stdin;
206	Lịch phỏng vấn mới được lên	Bạn có lịch phỏng vấn vị trí 'Senior Fullstack Engineer (React 19 & Python FastAPI)' vào ngày mai lúc 10:00 qua Google Meet.	application_update	f	535	2026-08-17 13:24:26.31384+00
207	Hồ sơ CV đã được xem	Nhà tuyển dụng TechCorp Vietnam đã duyệt hồ sơ ứng tuyển của bạn.	application_update	f	535	2026-08-17 13:24:26.31384+00
208	Ứng viên mới có điểm AI Match cao (94.5%)	Ứng viên Nguyễn Văn An vừa nộp đơn ứng tuyển vào vị trí Senior Fullstack Engineer với điểm AI Matching 94.5%.	application_update	f	533	2026-08-17 13:24:26.31384+00
209	Yêu cầu tuyển dụng mới cần duyệt	Trưởng bộ phận Hoàng Nam vừa gửi yêu cầu tuyển dụng: 'Tuyển dụng 1 Chuyên viên UI/UX Designer'.	system	f	533	2026-08-17 13:24:26.31384+00
\.


--
-- Data for Name: oauth_accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.oauth_accounts (id, user_id, provider, provider_user_id, email, access_token, id_token, created_at) FROM stdin;
\.


--
-- Data for Name: recruitment_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recruitment_requests (id, company_id, department_id, requested_by_id, title, headcount, job_type, priority, reason, responsibilities, requirements, target_start_date, status, review_note, reviewed_by_id, submitted_at, reviewed_at, cancelled_at, converted_job_id, converted_at, created_at, updated_at) FROM stdin;
8	234	22	534	Tuyển dụng 2 Kỹ sư Backend (Python / FastAPI)	2	full_time	high	Mở rộng dự án AI Matching Engine cho khách hàng Enterprise, khối lượng công việc tăng 80%.	Xây dựng API Backend với FastAPI, tích hợp pgvector, tối ưu hóa hiệu năng cơ sở dữ liệu và triển khai CI/CD.	3+ năm kinh nghiệm Python, FastAPI, PostgreSQL, Docker. Có kinh nghiệm với Vector Search là lợi thế.	\N	approved	Đã phê duyệt ngân sách tuyển dụng cho quý 3.	533	2026-08-12 13:24:26.307174+00	2026-08-14 13:24:26.307185+00	\N	\N	\N	2026-08-17 13:24:26.30438+00	2026-08-17 13:24:26.30438+00
9	234	23	534	Tuyển dụng 1 Chuyên viên UI/UX Designer	1	full_time	normal	Tái cấu trúc giao diện Mobile App và xây dựng thư viện Design System mới.	Thiết kế Wireframe, Prototype trên Figma, phỏng vấn người dùng và phối hợp với Frontend team.	2+ năm kinh nghiệm thiết kế sản phẩm SaaS hoặc Mobile App. Thành thạo Figma và Design Tokens.	\N	submitted	\N	\N	2026-08-17 09:24:26.307731+00	\N	\N	\N	\N	2026-08-17 13:24:26.30438+00	2026-08-17 13:24:26.30438+00
\.


--
-- Data for Name: resumes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.resumes (id, title, file_url, raw_text, parsed_skills, parsed_experience, embedding, user_id, created_at, updated_at, ai_evaluation_json) FROM stdin;
97	CV Nguyễn Văn An - Senior Fullstack	/uploads/resumes/cv_sample_1.pdf	Hồ sơ ứng viên Nguyễn Văn An. Chuyên môn cao về React, TypeScript, FastAPI, PostgreSQL, Tailwind CSS, Docker. 3-5 năm kinh nghiệm.	["React", "TypeScript", "FastAPI", "PostgreSQL", "Tailwind CSS", "Docker"]	[{"role": "Senior Engineer", "company": "Global Software Ltd", "years": 3}]	[0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035]	535	2026-08-03 13:24:24.699334+00	2026-08-17 13:24:24.693703+00	{"overall_score": 94.5, "strengths": ["Th\\u00e0nh th\\u1ea1o React", "C\\u00f3 kinh nghi\\u1ec7m th\\u1ef1c chi\\u1ebfn v\\u1edbi TypeScript"], "weaknesses": ["C\\u1ea7n b\\u1ed5 sung th\\u00eam ch\\u1ee9ng ch\\u1ec9 qu\\u1ed1c t\\u1ebf"], "skill_analysis": {"React": 9.5, "TypeScript": 9.0, "FastAPI": 9.0, "PostgreSQL": 8.5, "Tailwind CSS": 9.5, "Docker": 8.5}, "summary": "\\u1ee8ng vi\\u00ean c\\u00f3 6 k\\u1ef9 n\\u0103ng c\\u1ed1t l\\u00f5i ph\\u00f9 h\\u1ee3p v\\u1edbi th\\u1ecb tr\\u01b0\\u1eddng."}
98	CV Lê Thị Mai - AI & Data Engineer	/uploads/resumes/cv_sample_2.pdf	Hồ sơ ứng viên Lê Thị Mai. Chuyên môn cao về Python, PyTorch, pgvector, FastAPI, Docker, LangChain. 3-5 năm kinh nghiệm.	["Python", "PyTorch", "pgvector", "FastAPI", "Docker", "LangChain"]	[{"role": "Senior Engineer", "company": "Global Software Ltd", "years": 3}]	[0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035]	536	2026-08-04 13:24:24.716818+00	2026-08-17 13:24:24.693703+00	{"overall_score": 91.0, "strengths": ["Th\\u00e0nh th\\u1ea1o Python", "C\\u00f3 kinh nghi\\u1ec7m th\\u1ef1c chi\\u1ebfn v\\u1edbi PyTorch"], "weaknesses": ["C\\u1ea7n b\\u1ed5 sung th\\u00eam ch\\u1ee9ng ch\\u1ec9 qu\\u1ed1c t\\u1ebf"], "skill_analysis": {"Python": 9.5, "PyTorch": 9.0, "pgvector": 9.0, "FastAPI": 8.5, "Docker": 8.5, "LangChain": 9.0}, "summary": "\\u1ee8ng vi\\u00ean c\\u00f3 6 k\\u1ef9 n\\u0103ng c\\u1ed1t l\\u00f5i ph\\u00f9 h\\u1ee3p v\\u1edbi th\\u1ecb tr\\u01b0\\u1eddng."}
99	CV Trần Quốc Huy - Lead Product Designer	/uploads/resumes/cv_sample_3.pdf	Hồ sơ ứng viên Trần Quốc Huy. Chuyên môn cao về Figma, Design System, UI/UX, User Research, Wireframing, Prototyping. 3-5 năm kinh nghiệm.	["Figma", "Design System", "UI/UX", "User Research", "Wireframing", "Prototyping"]	[{"role": "Senior Engineer", "company": "Global Software Ltd", "years": 3}]	[0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035]	537	2026-08-05 13:24:24.9426+00	2026-08-17 13:24:24.693703+00	{"overall_score": 88.0, "strengths": ["Th\\u00e0nh th\\u1ea1o Figma", "C\\u00f3 kinh nghi\\u1ec7m th\\u1ef1c chi\\u1ebfn v\\u1edbi Design System"], "weaknesses": ["C\\u1ea7n b\\u1ed5 sung th\\u00eam ch\\u1ee9ng ch\\u1ec9 qu\\u1ed1c t\\u1ebf"], "skill_analysis": {"Figma": 9.5, "Design System": 9.0, "UI/UX": 9.0, "User Research": 8.5, "Wireframing": 9.0, "Prototyping": 9.0}, "summary": "\\u1ee8ng vi\\u00ean c\\u00f3 6 k\\u1ef9 n\\u0103ng c\\u1ed1t l\\u00f5i ph\\u00f9 h\\u1ee3p v\\u1edbi th\\u1ecb tr\\u01b0\\u1eddng."}
100	CV Phạm Minh Khoa - DevOps Engineer	/uploads/resumes/cv_sample_4.pdf	Hồ sơ ứng viên Phạm Minh Khoa. Chuyên môn cao về Kubernetes, Docker, AWS, Terraform, CI/CD, Linux. 3-5 năm kinh nghiệm.	["Kubernetes", "Docker", "AWS", "Terraform", "CI/CD", "Linux"]	[{"role": "Senior Engineer", "company": "Global Software Ltd", "years": 3}]	[0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035]	538	2026-08-06 13:24:25.162297+00	2026-08-17 13:24:24.693703+00	{"overall_score": 96.0, "strengths": ["Th\\u00e0nh th\\u1ea1o Kubernetes", "C\\u00f3 kinh nghi\\u1ec7m th\\u1ef1c chi\\u1ebfn v\\u1edbi Docker"], "weaknesses": ["C\\u1ea7n b\\u1ed5 sung th\\u00eam ch\\u1ee9ng ch\\u1ec9 qu\\u1ed1c t\\u1ebf"], "skill_analysis": {"Kubernetes": 9.5, "Docker": 9.5, "AWS": 9.0, "Terraform": 8.5, "CI/CD": 9.0, "Linux": 9.0}, "summary": "\\u1ee8ng vi\\u00ean c\\u00f3 6 k\\u1ef9 n\\u0103ng c\\u1ed1t l\\u00f5i ph\\u00f9 h\\u1ee3p v\\u1edbi th\\u1ecb tr\\u01b0\\u1eddng."}
101	CV Hoàng Thu Trang - Frontend Dev	/uploads/resumes/cv_sample_5.pdf	Hồ sơ ứng viên Hoàng Thu Trang. Chuyên môn cao về React, JavaScript, CSS3, HTML5, Tailwind, Responsive. 3-5 năm kinh nghiệm.	["React", "JavaScript", "CSS3", "HTML5", "Tailwind", "Responsive"]	[{"role": "Senior Engineer", "company": "Global Software Ltd", "years": 3}]	[0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035]	539	2026-08-07 13:24:25.382565+00	2026-08-17 13:24:24.693703+00	{"overall_score": 82.5, "strengths": ["Th\\u00e0nh th\\u1ea1o React", "C\\u00f3 kinh nghi\\u1ec7m th\\u1ef1c chi\\u1ebfn v\\u1edbi JavaScript"], "weaknesses": ["C\\u1ea7n b\\u1ed5 sung th\\u00eam ch\\u1ee9ng ch\\u1ec9 qu\\u1ed1c t\\u1ebf"], "skill_analysis": {"React": 8.5, "JavaScript": 8.5, "CSS3": 9.0, "HTML5": 9.0, "Tailwind": 8.5, "Responsive": 9.0}, "summary": "\\u1ee8ng vi\\u00ean c\\u00f3 6 k\\u1ef9 n\\u0103ng c\\u1ed1t l\\u00f5i ph\\u00f9 h\\u1ee3p v\\u1edbi th\\u1ecb tr\\u01b0\\u1eddng."}
102	CV Vũ Đức Thắng - Fullstack Dev	/uploads/resumes/cv_sample_6.pdf	Hồ sơ ứng viên Vũ Đức Thắng. Chuyên môn cao về Python, FastAPI, React, MySQL, Docker, REST API. 3-5 năm kinh nghiệm.	["Python", "FastAPI", "React", "MySQL", "Docker", "REST API"]	[{"role": "Senior Engineer", "company": "Global Software Ltd", "years": 3}]	[0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035]	540	2026-08-08 13:24:25.599407+00	2026-08-17 13:24:24.693703+00	{"overall_score": 79.0, "strengths": ["Th\\u00e0nh th\\u1ea1o Python", "C\\u00f3 kinh nghi\\u1ec7m th\\u1ef1c chi\\u1ebfn v\\u1edbi FastAPI"], "weaknesses": ["C\\u1ea7n b\\u1ed5 sung th\\u00eam ch\\u1ee9ng ch\\u1ec9 qu\\u1ed1c t\\u1ebf"], "skill_analysis": {"Python": 8.0, "FastAPI": 8.0, "React": 7.5, "MySQL": 8.0, "Docker": 7.0, "REST API": 8.5}, "summary": "\\u1ee8ng vi\\u00ean c\\u00f3 6 k\\u1ef9 n\\u0103ng c\\u1ed1t l\\u00f5i ph\\u00f9 h\\u1ee3p v\\u1edbi th\\u1ecb tr\\u01b0\\u1eddng."}
103	CV Đoàn Ngọc Linh - UI Designer	/uploads/resumes/cv_sample_7.pdf	Hồ sơ ứng viên Đoàn Ngọc Linh. Chuyên môn cao về Figma, UI Design, Mobile UI, Prototyping, Design System, Adobe XD. 3-5 năm kinh nghiệm.	["Figma", "UI Design", "Mobile UI", "Prototyping", "Design System", "Adobe XD"]	[{"role": "Senior Engineer", "company": "Global Software Ltd", "years": 3}]	[0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035]	541	2026-08-09 13:24:25.83461+00	2026-08-17 13:24:24.693703+00	{"overall_score": 85.0, "strengths": ["Th\\u00e0nh th\\u1ea1o Figma", "C\\u00f3 kinh nghi\\u1ec7m th\\u1ef1c chi\\u1ebfn v\\u1edbi UI Design"], "weaknesses": ["C\\u1ea7n b\\u1ed5 sung th\\u00eam ch\\u1ee9ng ch\\u1ec9 qu\\u1ed1c t\\u1ebf"], "skill_analysis": {"Figma": 8.5, "UI Design": 8.5, "Mobile UI": 9.0, "Prototyping": 8.0, "Design System": 7.5, "Adobe XD": 8.0}, "summary": "\\u1ee8ng vi\\u00ean c\\u00f3 6 k\\u1ef9 n\\u0103ng c\\u1ed1t l\\u00f5i ph\\u00f9 h\\u1ee3p v\\u1edbi th\\u1ecb tr\\u01b0\\u1eddng."}
104	CV Đặng Tuấn Kiệt - Systems	/uploads/resumes/cv_sample_8.pdf	Hồ sơ ứng viên Đặng Tuấn Kiệt. Chuyên môn cao về Linux, Bash, Docker, Git, Monitoring, Python. 3-5 năm kinh nghiệm.	["Linux", "Bash", "Docker", "Git", "Monitoring", "Python"]	[{"role": "Senior Engineer", "company": "Global Software Ltd", "years": 3}]	[0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035,0.035]	542	2026-08-10 13:24:26.057222+00	2026-08-17 13:24:24.693703+00	{"overall_score": 62.0, "strengths": ["Th\\u00e0nh th\\u1ea1o Linux", "C\\u00f3 kinh nghi\\u1ec7m th\\u1ef1c chi\\u1ebfn v\\u1edbi Bash"], "weaknesses": ["C\\u1ea7n b\\u1ed5 sung th\\u00eam ch\\u1ee9ng ch\\u1ec9 qu\\u1ed1c t\\u1ebf"], "skill_analysis": {"Linux": 7.0, "Bash": 7.0, "Docker": 6.5, "Git": 7.0, "Monitoring": 6.0, "Python": 6.0}, "summary": "\\u1ee8ng vi\\u00ean c\\u00f3 6 k\\u1ef9 n\\u0103ng c\\u1ed1t l\\u00f5i ph\\u00f9 h\\u1ee3p v\\u1edbi th\\u1ecb tr\\u01b0\\u1eddng."}
105	CV Nguyễn Văn An	/uploads/resumes/demo_cv.pdf	Ứng viên chuyên nghiệp với thế mạnh về React, TypeScript, Next.js, Tailwind CSS, Redux, Zustand. 4 năm kinh nghiệm phát triển phần mềm.	["React", "TypeScript", "Next.js", "Tailwind CSS", "Redux", "Zustand"]	[{"role": "Software Engineer", "company": "Tech Corp", "duration": "3 years"}]	[0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02]	544	2026-08-19 12:28:21.3593+00	2026-08-19 12:28:21.3593+00	\N
\.


--
-- Data for Name: round_criteria_scores; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.round_criteria_scores (id, round_id, criteria_name, score, notes) FROM stdin;
65	212	Kiến trúc hệ thống & Clean Code	9	Tư duy thiết kế module rất rõ ràng.
66	212	Kỹ năng React & TypeScript	9	Nắm chắc React hooks và TypeScript strict typing.
67	212	Kỹ năng Backend FastAPI & Database	8	Tối ưu query SQL và transaction tốt.
74	220	Kiến trúc hệ thống & Clean Code	9	Tư duy thiết kế module rất rõ ràng.
75	220	Kỹ năng React & TypeScript	9	Nắm chắc React hooks và TypeScript strict typing.
76	220	Kỹ năng Backend FastAPI & Database	8	Tối ưu query SQL và transaction tốt.
87	222	Kỹ năng chuyên môn	5	
88	222	Kỹ năng giao tiếp	5	
89	222	Kinh nghiệm thực tế	5	
90	222	Thái độ / Tinh thần	5	
91	222	Phù hợp văn hóa	5	
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, hashed_password, full_name, role, avatar_url, phone, is_active, company_name, company_logo_url, company_description, created_at, updated_at) FROM stdin;
544	nguyen.van.an@techdemo.vn	$2b$12$3T9/gZXl.PJwx1BmKKpg2uJnGUUzFSq1OVa1MUhHWRGKOUnkU8TY6	Nguyễn Văn An	candidate	\N	0912345601	t	\N	\N	\N	2026-08-19 12:28:21.3593+00	2026-08-19 12:28:21.3593+00
545	ductrandanh06@gmail.com		Danh Đức	candidate	https://lh3.googleusercontent.com/a/ACg8ocJN07XBwRQl_qWsC_423MRN14Dsp97o-TdE8UZnMyCKXRe9HA=s96-c	\N	t	\N	\N	\N	2026-08-20 19:09:25.46482+00	2026-08-20 19:09:25.46482+00
543	admin@jobportal.com	$2b$12$B0dl5mpq8w90QXIEpYOyTusWwfqi4rMj./56538Dig6jJCcGdrnfi	System Administrator	admin	\N	\N	t	\N	\N	\N	2026-08-19 12:28:20.405797+00	2026-08-21 06:32:58.55601+00
534	techlead@techcorp.vn	$2b$12$D8uxPX6Q3SOqeD1qXPwmD.AGf1TpU0wSaNoa6Lu5HbCqlHJ9hL/y6	Hoàng Nam - Tech Lead	employer	\N	0909888999	t	TechCorp Vietnam	\N	\N	2026-08-17 13:24:23.722081+00	2026-08-17 13:24:23.722081+00
536	le.thi.mai@techdemo.vn	$2b$12$vAkxShT2iR5/FnwDMaglHe9fFk2pZe1iIkhciii011Mo.1NcBTISa	Lê Thị Mai	candidate	\N	0912345602	t	\N	\N	\N	2026-08-04 13:24:24.716818+00	2026-08-17 13:24:24.693703+00
537	tran.quoc.huy@techdemo.vn	$2b$12$hp93fXN28oCFA3UvIeN2WOjHTNcCBzqQusdQ82n5qBydESke4zMhS	Trần Quốc Huy	candidate	\N	0912345603	t	\N	\N	\N	2026-08-05 13:24:24.9426+00	2026-08-17 13:24:24.693703+00
538	pham.minh.khoa@techdemo.vn	$2b$12$/xUHqY5yecIjVErPcDJakO4PQg9jmbaqTl4Pq0X0iwX0e2ulZ7GAC	Phạm Minh Khoa	candidate	\N	0912345604	t	\N	\N	\N	2026-08-06 13:24:25.162297+00	2026-08-17 13:24:24.693703+00
539	hoang.thu.trang@techdemo.vn	$2b$12$fv8zkoSweZ.4aJHzFoOs1uB.zZMqPdsyh5D0Ei3OKtpVFm0GCNDXG	Hoàng Thu Trang	candidate	\N	0912345605	t	\N	\N	\N	2026-08-07 13:24:25.382565+00	2026-08-17 13:24:24.693703+00
540	vu.duc.thang@techdemo.vn	$2b$12$F3JpR1D5aUrIL/eff.r7euNt19H7X9OJRMTB6fAqgsMzrt9BTc7/W	Vũ Đức Thắng	candidate	\N	0912345606	t	\N	\N	\N	2026-08-08 13:24:25.599407+00	2026-08-17 13:24:24.693703+00
541	doan.ngoc.linh@techdemo.vn	$2b$12$T3vjDFfL7cFHpBVbyewJieonMBiJ20PI5EwRq8xdfKyK0P.xv8SdK	Đoàn Ngọc Linh	candidate	\N	0912345607	t	\N	\N	\N	2026-08-09 13:24:25.83461+00	2026-08-17 13:24:24.693703+00
542	dang.tuan.kiet@techdemo.vn	$2b$12$J8DH1guq0Ppo4/sybRJUYebxje3/RT9Y1pAsrZcnNIVT0jasM.uIO	Đặng Tuấn Kiệt	candidate	\N	0912345608	t	\N	\N	\N	2026-08-10 13:24:26.057222+00	2026-08-17 13:24:24.693703+00
532	admin@jobportal.vn	$2b$12$cegnq9/VqEAD/sXV9ZFyJO/bPFN2Uw.FQ/91SDBZ9MjynNsLOZwqq	Quản Trị Viên Hệ Thống	admin	\N	0901000001	t	\N	\N	\N	2026-08-17 13:24:23.722081+00	2026-08-21 06:32:58.55601+00
533	employer@techcorp.vn	$2b$12$f2WmzJhX5/7zV8ZiXkTQheVh8iUFts6zwL29nWyYqT3EmBPnvtghO	Trần Thị Mai HR	employer	\N	0901234567	t	TechCorp VN	\N	Tập đoàn công nghệ và giải pháp phần mềm hàng đầu tại Việt Nam, tiên phong ứng dụng AI trong quản trị doanh nghiệp.	2026-08-17 13:24:23.722081+00	2026-08-21 06:32:58.55601+00
535	candidate@jobportal.vn	$2b$12$bcTO6PdA8gXcwEGZAogetOnykZKHz44Vdsfg2m2X.F4CKmVhlqyM6	Nguyễn Văn An	candidate	\N	0912345678	t	\N	\N	\N	2026-08-03 13:24:24.699334+00	2026-08-21 06:32:58.55601+00
\.


--
-- Name: admin_audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admin_audit_logs_id_seq', 245, true);


--
-- Name: applications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.applications_id_seq', 176, true);


--
-- Name: assessment_attempts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assessment_attempts_id_seq', 1, false);


--
-- Name: companies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.companies_id_seq', 234, true);


--
-- Name: company_invitations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.company_invitations_id_seq', 15, true);


--
-- Name: company_memberships_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.company_memberships_id_seq', 253, true);


--
-- Name: cv_documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cv_documents_id_seq', 36, true);


--
-- Name: departments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.departments_id_seq', 23, true);


--
-- Name: interview_rounds_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.interview_rounds_id_seq', 224, true);


--
-- Name: job_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.job_assignments_id_seq', 1, false);


--
-- Name: job_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.job_categories_id_seq', 34, true);


--
-- Name: jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.jobs_id_seq', 210, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 209, true);


--
-- Name: oauth_accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.oauth_accounts_id_seq', 3, true);


--
-- Name: recruitment_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.recruitment_requests_id_seq', 9, true);


--
-- Name: resumes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.resumes_id_seq', 105, true);


--
-- Name: round_criteria_scores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.round_criteria_scores_id_seq', 91, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 545, true);


--
-- Name: admin_audit_logs admin_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_audit_logs
    ADD CONSTRAINT admin_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: applications applications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_pkey PRIMARY KEY (id);


--
-- Name: assessment_attempts assessment_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_attempts
    ADD CONSTRAINT assessment_attempts_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: company_invitations company_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_invitations
    ADD CONSTRAINT company_invitations_pkey PRIMARY KEY (id);


--
-- Name: company_invitations company_invitations_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_invitations
    ADD CONSTRAINT company_invitations_token_hash_key UNIQUE (token_hash);


--
-- Name: company_memberships company_memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_memberships
    ADD CONSTRAINT company_memberships_pkey PRIMARY KEY (id);


--
-- Name: cv_documents cv_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cv_documents
    ADD CONSTRAINT cv_documents_pkey PRIMARY KEY (id);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: interview_rounds interview_rounds_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interview_rounds
    ADD CONSTRAINT interview_rounds_pkey PRIMARY KEY (id);


--
-- Name: job_assignments job_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_assignments
    ADD CONSTRAINT job_assignments_pkey PRIMARY KEY (id);


--
-- Name: job_categories job_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_categories
    ADD CONSTRAINT job_categories_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: oauth_accounts oauth_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.oauth_accounts
    ADD CONSTRAINT oauth_accounts_pkey PRIMARY KEY (id);


--
-- Name: recruitment_requests recruitment_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruitment_requests
    ADD CONSTRAINT recruitment_requests_pkey PRIMARY KEY (id);


--
-- Name: resumes resumes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resumes
    ADD CONSTRAINT resumes_pkey PRIMARY KEY (id);


--
-- Name: round_criteria_scores round_criteria_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.round_criteria_scores
    ADD CONSTRAINT round_criteria_scores_pkey PRIMARY KEY (id);


--
-- Name: company_invitations uq_company_invitations_message_id; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_invitations
    ADD CONSTRAINT uq_company_invitations_message_id UNIQUE (message_id);


--
-- Name: company_memberships uq_company_membership_user; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_memberships
    ADD CONSTRAINT uq_company_membership_user UNIQUE (company_id, user_id);


--
-- Name: departments uq_department_company_name; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT uq_department_company_name UNIQUE (company_id, name);


--
-- Name: job_assignments uq_job_assignment_membership; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_assignments
    ADD CONSTRAINT uq_job_assignment_membership UNIQUE (job_id, membership_id);


--
-- Name: job_categories uq_job_categories_name; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_categories
    ADD CONSTRAINT uq_job_categories_name UNIQUE (name);


--
-- Name: job_categories uq_job_categories_slug; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_categories
    ADD CONSTRAINT uq_job_categories_slug UNIQUE (slug);


--
-- Name: recruitment_requests uq_recruitment_requests_converted_job_id; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruitment_requests
    ADD CONSTRAINT uq_recruitment_requests_converted_job_id UNIQUE (converted_job_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ix_admin_audit_company_activity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_admin_audit_company_activity ON public.admin_audit_logs USING btree (company_id, created_at);


--
-- Name: ix_admin_audit_logs_action; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_admin_audit_logs_action ON public.admin_audit_logs USING btree (action);


--
-- Name: ix_admin_audit_logs_actor_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_admin_audit_logs_actor_user_id ON public.admin_audit_logs USING btree (actor_user_id);


--
-- Name: ix_admin_audit_logs_company_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_admin_audit_logs_company_id ON public.admin_audit_logs USING btree (company_id);


--
-- Name: ix_admin_audit_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_admin_audit_logs_created_at ON public.admin_audit_logs USING btree (created_at);


--
-- Name: ix_admin_audit_logs_target_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_admin_audit_logs_target_type ON public.admin_audit_logs USING btree (target_type);


--
-- Name: ix_admin_audit_target; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_admin_audit_target ON public.admin_audit_logs USING btree (target_type, target_id);


--
-- Name: ix_applications_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_applications_id ON public.applications USING btree (id);


--
-- Name: ix_assessment_attempt_user_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_assessment_attempt_user_type ON public.assessment_attempts USING btree (user_id, assessment_type);


--
-- Name: ix_assessment_attempts_assessment_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_assessment_attempts_assessment_type ON public.assessment_attempts USING btree (assessment_type);


--
-- Name: ix_assessment_attempts_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_assessment_attempts_id ON public.assessment_attempts USING btree (id);


--
-- Name: ix_assessment_attempts_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_assessment_attempts_user_id ON public.assessment_attempts USING btree (user_id);


--
-- Name: ix_companies_created_by_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_companies_created_by_user_id ON public.companies USING btree (created_by_user_id);


--
-- Name: ix_companies_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_companies_name ON public.companies USING btree (name);


--
-- Name: ix_company_invitation_lookup; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_company_invitation_lookup ON public.company_invitations USING btree (company_id, email, status);


--
-- Name: ix_company_invitations_company_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_company_invitations_company_id ON public.company_invitations USING btree (company_id);


--
-- Name: ix_company_invitations_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_company_invitations_email ON public.company_invitations USING btree (email);


--
-- Name: ix_company_membership_scope; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_company_membership_scope ON public.company_memberships USING btree (company_id, department_id, member_role, status);


--
-- Name: ix_company_memberships_company_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_company_memberships_company_id ON public.company_memberships USING btree (company_id);


--
-- Name: ix_company_memberships_department_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_company_memberships_department_id ON public.company_memberships USING btree (department_id);


--
-- Name: ix_company_memberships_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_company_memberships_user_id ON public.company_memberships USING btree (user_id);


--
-- Name: ix_cv_documents_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_cv_documents_id ON public.cv_documents USING btree (id);


--
-- Name: ix_cv_documents_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_cv_documents_user_id ON public.cv_documents USING btree (user_id);


--
-- Name: ix_departments_company_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_departments_company_id ON public.departments USING btree (company_id);


--
-- Name: ix_interview_rounds_application_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_interview_rounds_application_id ON public.interview_rounds USING btree (application_id);


--
-- Name: ix_interview_rounds_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_interview_rounds_id ON public.interview_rounds USING btree (id);


--
-- Name: ix_interview_rounds_needs_review; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_interview_rounds_needs_review ON public.interview_rounds USING btree (needs_review);


--
-- Name: ix_interview_rounds_overdue; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_interview_rounds_overdue ON public.interview_rounds USING btree (status, scheduled_at);


--
-- Name: ix_interview_rounds_review_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_interview_rounds_review_status ON public.interview_rounds USING btree (needs_review, round_type, status);


--
-- Name: ix_job_assignments_job_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_job_assignments_job_id ON public.job_assignments USING btree (job_id);


--
-- Name: ix_job_assignments_membership_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_job_assignments_membership_id ON public.job_assignments USING btree (membership_id);


--
-- Name: ix_job_categories_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_job_categories_id ON public.job_categories USING btree (id);


--
-- Name: ix_jobs_company_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_jobs_company_id ON public.jobs USING btree (company_id);


--
-- Name: ix_jobs_department_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_jobs_department_id ON public.jobs USING btree (department_id);


--
-- Name: ix_jobs_embedding_hnsw; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_jobs_embedding_hnsw ON public.jobs USING hnsw (embedding public.vector_cosine_ops) WITH (m='16', ef_construction='64');


--
-- Name: ix_jobs_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_jobs_id ON public.jobs USING btree (id);


--
-- Name: ix_jobs_title; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_jobs_title ON public.jobs USING btree (title);


--
-- Name: ix_notifications_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_notifications_id ON public.notifications USING btree (id);


--
-- Name: ix_notifications_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_notifications_user_id ON public.notifications USING btree (user_id);


--
-- Name: ix_oauth_accounts_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_oauth_accounts_id ON public.oauth_accounts USING btree (id);


--
-- Name: ix_oauth_accounts_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_oauth_accounts_user_id ON public.oauth_accounts USING btree (user_id);


--
-- Name: ix_recruitment_request_company_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_recruitment_request_company_status ON public.recruitment_requests USING btree (company_id, status, created_at);


--
-- Name: ix_recruitment_request_department_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_recruitment_request_department_status ON public.recruitment_requests USING btree (department_id, status, created_at);


--
-- Name: ix_recruitment_requests_company_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_recruitment_requests_company_id ON public.recruitment_requests USING btree (company_id);


--
-- Name: ix_recruitment_requests_department_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_recruitment_requests_department_id ON public.recruitment_requests USING btree (department_id);


--
-- Name: ix_recruitment_requests_requested_by_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_recruitment_requests_requested_by_id ON public.recruitment_requests USING btree (requested_by_id);


--
-- Name: ix_resumes_embedding_hnsw; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_resumes_embedding_hnsw ON public.resumes USING hnsw (embedding public.vector_cosine_ops) WITH (m='16', ef_construction='64');


--
-- Name: ix_resumes_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_resumes_id ON public.resumes USING btree (id);


--
-- Name: ix_round_criteria_scores_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_round_criteria_scores_id ON public.round_criteria_scores USING btree (id);


--
-- Name: ix_round_criteria_scores_round_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_round_criteria_scores_round_id ON public.round_criteria_scores USING btree (round_id);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- Name: admin_audit_logs admin_audit_logs_actor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_audit_logs
    ADD CONSTRAINT admin_audit_logs_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: applications applications_candidate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.users(id);


--
-- Name: applications applications_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id);


--
-- Name: applications applications_resume_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_resume_id_fkey FOREIGN KEY (resume_id) REFERENCES public.resumes(id);


--
-- Name: assessment_attempts assessment_attempts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_attempts
    ADD CONSTRAINT assessment_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: companies companies_created_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.users(id);


--
-- Name: company_invitations company_invitations_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_invitations
    ADD CONSTRAINT company_invitations_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: company_invitations company_invitations_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_invitations
    ADD CONSTRAINT company_invitations_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;


--
-- Name: company_invitations company_invitations_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_invitations
    ADD CONSTRAINT company_invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.users(id);


--
-- Name: company_memberships company_memberships_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_memberships
    ADD CONSTRAINT company_memberships_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: company_memberships company_memberships_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_memberships
    ADD CONSTRAINT company_memberships_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;


--
-- Name: company_memberships company_memberships_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_memberships
    ADD CONSTRAINT company_memberships_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: company_memberships company_memberships_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_memberships
    ADD CONSTRAINT company_memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: cv_documents cv_documents_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cv_documents
    ADD CONSTRAINT cv_documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: departments departments_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: admin_audit_logs fk_admin_audit_logs_company_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_audit_logs
    ADD CONSTRAINT fk_admin_audit_logs_company_id FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: applications fk_applications_cv_document_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT fk_applications_cv_document_id FOREIGN KEY (cv_document_id) REFERENCES public.cv_documents(id) ON DELETE SET NULL;


--
-- Name: applications fk_applications_decision_by; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT fk_applications_decision_by FOREIGN KEY (decision_by_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: applications fk_applications_recommendation_by; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT fk_applications_recommendation_by FOREIGN KEY (recommendation_by_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: jobs fk_jobs_company_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT fk_jobs_company_id FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: jobs fk_jobs_department_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT fk_jobs_department_id FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;


--
-- Name: interview_rounds interview_rounds_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interview_rounds
    ADD CONSTRAINT interview_rounds_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;


--
-- Name: interview_rounds interview_rounds_marked_by_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interview_rounds
    ADD CONSTRAINT interview_rounds_marked_by_admin_id_fkey FOREIGN KEY (marked_by_admin_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: interview_rounds interview_rounds_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interview_rounds
    ADD CONSTRAINT interview_rounds_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(id);


--
-- Name: job_assignments job_assignments_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_assignments
    ADD CONSTRAINT job_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id);


--
-- Name: job_assignments job_assignments_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_assignments
    ADD CONSTRAINT job_assignments_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;


--
-- Name: job_assignments job_assignments_membership_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_assignments
    ADD CONSTRAINT job_assignments_membership_id_fkey FOREIGN KEY (membership_id) REFERENCES public.company_memberships(id) ON DELETE CASCADE;


--
-- Name: jobs jobs_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.job_categories(id);


--
-- Name: jobs jobs_employer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_employer_id_fkey FOREIGN KEY (employer_id) REFERENCES public.users(id);


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: oauth_accounts oauth_accounts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.oauth_accounts
    ADD CONSTRAINT oauth_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: recruitment_requests recruitment_requests_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruitment_requests
    ADD CONSTRAINT recruitment_requests_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: recruitment_requests recruitment_requests_converted_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruitment_requests
    ADD CONSTRAINT recruitment_requests_converted_job_id_fkey FOREIGN KEY (converted_job_id) REFERENCES public.jobs(id) ON DELETE SET NULL;


--
-- Name: recruitment_requests recruitment_requests_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruitment_requests
    ADD CONSTRAINT recruitment_requests_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE RESTRICT;


--
-- Name: recruitment_requests recruitment_requests_requested_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruitment_requests
    ADD CONSTRAINT recruitment_requests_requested_by_id_fkey FOREIGN KEY (requested_by_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: recruitment_requests recruitment_requests_reviewed_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruitment_requests
    ADD CONSTRAINT recruitment_requests_reviewed_by_id_fkey FOREIGN KEY (reviewed_by_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: resumes resumes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resumes
    ADD CONSTRAINT resumes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: round_criteria_scores round_criteria_scores_round_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.round_criteria_scores
    ADD CONSTRAINT round_criteria_scores_round_id_fkey FOREIGN KEY (round_id) REFERENCES public.interview_rounds(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 7jZTxTyH0bWfJWwCq3BnjDNMhZfRvP7pAO0a5FSfNYM9bmg2g8miHD9XRz6GcKg

