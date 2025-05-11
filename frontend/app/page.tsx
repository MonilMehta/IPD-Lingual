"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, useInView, useAnimation, useScroll, useTransform } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  Camera,
  Mic,
  Book,
  Globe,
  Map,
  Award,
  MessageSquare,
  Download,
  ArrowRight,
  ExternalLink,
  Star,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Timeline } from "@/components/ui/timeline"
import { AnimatedTestimonials } from "@/components/ui/animated-testimonials"

const MotionDiv = motion.div

const FadeInWhenVisible = ({ children, delay = 0, className = "" }) => {
  const controls = useAnimation()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })

  useEffect(() => {
    if (isInView) {
      controls.start("visible")
    }
  }, [controls, isInView])

  return (
    <MotionDiv
      ref={ref}
      animate={controls}
      initial="hidden"
      transition={{ duration: 0.5, delay }}
      variants={{
        visible: { opacity: 1, y: 0 },
        hidden: { opacity: 0, y: 50 },
      }}
      className={className}
    >
      {children}
    </MotionDiv>
  )
}


function AnimatedTestimonialsBasic() {

  return (

    <AnimatedTestimonials

      testimonials={[

        {

          id: 1,
          name: "Priya K.",
          role: "First-time Traveler",
          company: "",
          content:
            "The travel guides feature helped me navigate Tokyo with confidence. Having common phrases for restaurants, transportation, and emergencies all organized by category was incredibly helpful.",
          rating: 5,
          avatar: "https://randomuser.me/api/portraits/women/32.jpg",
        },

        {

          id: 2,

          name: "Sarah Miller",

          role: "Student",

          company: "",

          content:"The voice translation feature helped me have actual conversations with locals during my backpacking trip across Europe. I made friends I wouldn't have been able to connect with otherwise. Incredible app!",
          rating: 5,
          avatar: "https://randomuser.me/api/portraits/women/44.jpg",
        },
        {
          id: 3,
          name: "Michael Chen",
          role: "Language Enthusiast",
          company: "InnovateLabs",
          content:
            "As someone learning multiple languages, Lingual has been a game-changer. The ability to switch between languages and track progress separately for each one is incredibly useful",
          rating: 5,
          avatar: "https://randomuser.me/api/portraits/men/46.jpg",

        },

      ]}

      trustedCompanies={["Google", "Microsoft", "Airbnb", "Spotify", "Netflix"]}

    />

  );

}

const timelineData = [
  {
    title: "Learn",
    content: (
      <div className="space-y-4 bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
        <h3 className="text-4xl font-bold">Master New Languages</h3>
        <p className="text-muted-foreground">
          Follow the gamified learning pathway to build your vocabulary and language skills through interactive quizzes
          and challenges.
        </p>
        <div className="grid grid-cols-2 gap-4 mt-4">                          <div className="relative h-[650px] w-full rounded-lg overflow-hidden border-4 border-gray-200">
                            <Image src="/Quiz.jpg" alt="Quiz Screen" fill className="object-cover" />
                          </div>
                          <div className="relative h-[650px] w-full rounded-lg overflow-hidden border-4 border-gray-200">
                            <Image src="/Phrases.jpg" alt="Phrases Screen" fill className="object-cover" />
                          </div>
        </div>
        <div className="flex gap-2 items-center text-primary mt-4">
          <div className="mr-2 h-1.5 w-1.5 rounded-full bg-primary"></div>
          <span className="text-lg">Interactive quizzes that adapt to your skill level</span>
        </div>
        <div className="flex gap-2 items-center text-primary">
          <div className="mr-2 h-1.5 w-1.5 rounded-full bg-primary"></div>
          <span className="text-lg">Visual progress tracking with achievements</span>
        </div>
        <div className="flex gap-2 items-center text-primary">
          <div className="mr-2 h-1.5 w-1.5 rounded-full bg-primary"></div>
          <span className="text-lg">Personalized learning path based on your goals</span>
        </div>
      </div>
    ),
  },
  {
    title: "Practice",
    content: (
      <div className="space-y-4 bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
        <h3 className="text-4xl font-bold">Real-World Application</h3>
        <p className="text-muted-foreground">
          Use the camera and voice translation features to practice in real-world scenarios, saving useful phrases to
          your phrasebook.
        </p>
        <div className="grid grid-cols-2 gap-4 mt-4">                          <div className="relative h-[650px] w-full rounded-lg overflow-hidden border-4 border-gray-200">
                            <Image src="/camera.jpg" alt="Camera Translation" fill className="object-cover" />
                          </div>
                          <div className="relative h-[650px] w-full rounded-lg overflow-hidden border-4 border-gray-200">
                            <Image src="/Voicetranslate.jpg" alt="Voice Translation" fill className="object-cover" />
                          </div>
        </div >
        <div className="flex gap-2 items-center text-primary mt-4">
          <div className="mr-2 h-1.5 w-1.5 rounded-full bg-primary"></div>
          <span className="text-lg">Instant camera translation of text and objects</span>
        </div>
        <div className="flex gap-2 items-center text-primary">
          <div className="mr-2 h-1.5 w-1.5 rounded-full bg-primary"></div>
          <span className="text-lg">Real-time voice translation for conversations</span>
        </div>
        <div className="flex gap-2 items-center text-primary">
          <div className="mr-2 h-1.5 w-1.5 rounded-full bg-primary"></div>
          <span className="text-lg">Save translations to your personal phrasebook</span>
        </div>
      </div>
    ),
  },
  {
    title: "Apply",
    content: (
      <div className="space-y-4 bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
        <h3 className="text-4xl font-bold">Travel With Confidence</h3>
        <p className="text-muted-foreground">
          Confidently navigate foreign environments with travel guides and instant translation tools at your fingertips.
        </p>
        <div className="grid grid-cols-2 gap-4 mt-4">                          <div className="relative h-[650px] w-full rounded-lg overflow-hidden border-4 border-gray-200">
                            <Image src="/texttranslation.jpg" alt="Text Translation" fill className="object-cover" />
                          </div>
                          <div className="relative h-[650px] w-full rounded-lg overflow-hidden border-4 border-gray-200">
                            <Image src="/Llama.jpg" alt="AI Assistant" fill className="object-cover" />
                          </div>
        </div>
        <div className="flex gap-2 items-center text-primary mt-4">
          <div className="mr-2 h-1.5 w-1.5 rounded-full bg-primary"></div>
          <span className="text-lg">Comprehensive travel guides with useful phrases</span>
        </div>
        <div className="flex gap-2 items-center text-primary">
          <div className="mr-2 h-1.5 w-1.5 rounded-full bg-primary"></div>
          <span className="text-lg">AI-powered language assistant for complex situations</span>
        </div>
        <div className="flex gap-2 items-center text-primary">
          <div className="mr-2 h-1.5 w-1.5 rounded-full bg-primary"></div>
          <span className="text-lg">Offline mode for essential translations without data</span>
        </div>
      </div>
    ),
  },
]

export default function Home() {
  const { scrollY } = useScroll()
  const heroRef = useRef(null)

  // Phone animation values
  const leftPhoneX = useTransform(scrollY, [0, 300], [0, -100])
  const rightPhoneX = useTransform(scrollY, [0, 300], [0, 100])
  const leftPhoneRotate = useTransform(scrollY, [0, 300], [0, -12])
  const rightPhoneRotate = useTransform(scrollY, [0, 300], [0, 12])
  const centerPhoneY = useTransform(scrollY, [0, 300], [0, -30])
  const phonesScale = useTransform(scrollY, [0, 300], [0.9, 1])

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
          <div className="flex gap-6 md:gap-10">
            <Link href="/" className="flex items-center space-x-2">
              <Globe className="h-6 w-6 text-primary" />
              <span className="inline-block font-bold">Lingual</span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <nav className="flex items-center space-x-2">
              <Button asChild variant="ghost" className="hover:bg-primary/10 hover:text-primary">
                <Link href="#features">Features</Link>
              </Button>
              <Button asChild variant="ghost" className="hover:bg-primary/10 hover:text-primary">
                <Link href="#how-it-works">How It Works</Link>
              </Button>
              <Button asChild variant="ghost" className="hover:bg-primary/10 hover:text-primary">
                <Link href="#testimonials">Testimonials</Link>
              </Button>
              <Button asChild className="bg-primary hover:bg-primary/90">
                <Link href="#download">
                  Get App <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 overflow-hidden bg-gradient-to-b from-orange-50 to-white">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <MotionDiv
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="flex flex-col justify-center space-y-4"
              >
                <div className="space-y-2">
                  <Badge className="inline-flex rounded-md bg-primary/10 text-primary">Coming soon to Play Store</Badge>
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-6xl xl:text-7xl/none leading-tight">
                    Learn Languages Through Real-World Interaction
                  </h1>
                  <p className="max-w-[700px] text-muted-foreground text-lg md:text-4xl">
                    A comprehensive language learning app that combines gamification, real-time translation, and
                    practical travel tools to make language learning fun and effective.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button
                    size="lg"
                    asChild
                    className="bg-primary hover:bg-primary/90 transition-all duration-200 transform hover:scale-105"
                  >
                    <Link href="#download">
                      <Download className="mr-2 h-4 w-4" /> Download Now
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className="border-primary text-primary hover:bg-primary/10 transition-all duration-200"
                  >
                    <Link href="#features">Learn More</Link>
                  </Button>
                </div>
              </MotionDiv>
              <div ref={heroRef} className="mx-auto flex items-center justify-center h-[600px] relative">
                {/* Left Phone */}
                <MotionDiv
                  style={{
                    x: leftPhoneX,
                    rotate: leftPhoneRotate,
                    scale: phonesScale,
                    zIndex: 1,
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="absolute h-[500px] w-[250px] rounded-[40px] border-8 border-muted bg-background p-2 shadow-xl"
                >
                  <div className="relative h-full w-full overflow-hidden rounded-[28px] bg-muted">
                    <Image
                      src="/Home.jpg"
                      width={250}
                      height={500}
                      alt="App screenshot - Home screen"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </MotionDiv>

                {/* Center Phone */}
                <MotionDiv
                  style={{
                    y: centerPhoneY,
                    scale: phonesScale,
                    zIndex: 3,
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8 }}
                  className="absolute h-[500px] w-[250px] rounded-[40px] border-8 border-muted bg-background p-2 shadow-xl"
                >
                  <div className="relative h-full w-full overflow-hidden rounded-[28px] bg-muted">
                    <Image
                      src="/camera.jpg"
                      width={250}
                      height={500}
                      alt="App screenshot - Camera translation"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </MotionDiv>

                {/* Right Phone */}
                <MotionDiv
                  style={{
                    x: rightPhoneX,
                    rotate: rightPhoneRotate,
                    scale: phonesScale,
                    zIndex: 2,
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  className="absolute h-[500px] w-[250px] rounded-[40px] border-8 border-muted bg-background p-2 shadow-xl"
                >
                  <div className="relative h-full w-full overflow-hidden rounded-[28px] bg-muted">
                    <Image
                      src="/Voicetranslate.jpg"
                      width={250}
                      height={500}
                      alt="App screenshot - Voice translation"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </MotionDiv>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-orange-50 relative">
          <div className="absolute inset-0 bg-[url('/placeholder.svg?height=20&width=20')] opacity-5"></div>
          <div className="container px-4 md:px-6 relative">
            <FadeInWhenVisible>
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-6">
                  <Map className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-4xl font-bold tracking-tighter sm:text-6xl">Key Features</h2>
                  <p className="max-w-[900px] text-muted-foreground text-xl md:text-4xl/relaxed">
                    Discover the powerful features that make language learning engaging and effective
                  </p>
                </div>
              </div>
            </FadeInWhenVisible>

            <div className="mt-16 grid gap-12">
              {/* Feature Row 1 */}
              <FadeInWhenVisible delay={0.1}>
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div className="order-2 md:order-1">
                    <div className="space-y-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Map className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-3xl font-bold">Learning Pathway</h3>
                      <p className="text-muted-foreground text-xl">
                        Our gamified learning experience keeps you motivated with:
                      </p>
                      <ul className="space-y-3 text-muted-foreground text-lg">
                        <li className="flex items-start">
                          <div className="mr-2 mt-1.5 h-2 w-2 rounded-full bg-primary"></div>
                          <span className="text-lg">Visual maps showing your progress journey</span>
                        </li>
                        <li className="flex items-start">
                          <div className="mr-2 mt-1 h-1.5 w-1.5 rounded-full bg-primary"></div>
                          <span className="text-lg">Interactive quizzes that adapt to your skill level</span>
                        </li>
                        <li className="flex items-start">
                          <div className="mr-2 mt-1 h-1.5 w-1.5 rounded-full bg-primary"></div>
                          <span className="text-lg">Achievement badges and milestone celebrations</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="order-1 md:order-2 flex justify-center">
                    <div className="relative h-[400px] w-[220px] rounded-[30px] border-8 border-muted bg-background p-2 shadow-xl transform transition-transform hover:scale-105 duration-300">
                      <div className="relative h-full w-full overflow-hidden rounded-[20px] bg-muted">
                        <Image
                          src="/Quiz.jpg"
                          width={220}
                          height={400}
                          alt="Learning pathway screenshot"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </FadeInWhenVisible>

              {/* Feature Row 2 */}
              <FadeInWhenVisible delay={0.2}>
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div className="flex justify-center">
                    <div className="relative h-[400px] w-[220px] rounded-[30px] border-8 border-muted bg-background p-2 shadow-xl transform transition-transform hover:scale-105 duration-300">
                      <div className="relative h-full w-full overflow-hidden rounded-[20px] bg-muted">
                        <Image
                          src="/camera.jpg"
                          width={220}
                          height={400}
                          alt="Camera translation screenshot"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="space-y-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Camera className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-6xl font-bold">Camera Translation</h3>
                      <p className="text-muted-foreground text-xl">
                        Point your camera and instantly understand your surroundings:
                      </p>
                      <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start">
                          <div className="mr-2 mt-1 h-1.5 w-1.5 rounded-full bg-primary"></div>
                          <span className="text-lg">Real-time text and object recognition</span>
                        </li>
                        <li className="flex items-start">
                          <div className="mr-2 mt-1 h-1.5 w-1.5 rounded-full bg-primary"></div>
                          <span className="text-lg">Contextual learning with example sentences</span>
                        </li>
                        <li className="flex items-start">
                          <div className="mr-2 mt-1 h-1.5 w-1.5 rounded-full bg-primary"></div>
                          <span className="text-lg">Save translations to your personal phrasebook</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </FadeInWhenVisible>

              {/* Feature Row 3 */}
              <FadeInWhenVisible delay={0.3}>
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div className="order-2 md:order-1">
                    <div className="space-y-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Mic className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-4xl font-bold">Voice Translation</h3>
                      <p className="text-muted-foreground text-xl">
                        Break language barriers with real-time conversation translation:
                      </p>
                      <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start">
                          <div className="mr-2 mt-1 h-1.5 w-1.5 rounded-full bg-primary"></div>
                          <span className="text-lg">Speak naturally and hear instant translations</span>
                        </li>
                        <li className="flex items-start">
                          <div className="mr-2 mt-1 h-1.5 w-1.5 rounded-full bg-primary"></div>
                          <span className="text-lg">Support for multiple languages and dialects</span>
                        </li>
                        <li className="flex items-start">
                          <div className="mr-2 mt-1 h-1.5 w-1.5 rounded-full bg-primary"></div>
                          <span className="text-lg">Works offline for essential phrases</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="order-1 md:order-2 flex justify-center">
                    <div className="relative h-[400px] w-[220px] rounded-[30px] border-8 border-muted bg-background p-2 shadow-xl transform transition-transform hover:scale-105 duration-300">
                      <div className="relative h-full w-full overflow-hidden rounded-[20px] bg-muted">
                        <Image
                          src="/Voicetranslate.jpg"
                          width={220}
                          height={400}
                          alt="Voice translation screenshot"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </FadeInWhenVisible>

              <FadeInWhenVisible delay={0.4}>
                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="flex flex-col justify-center space-y-4 rounded-lg border bg-background p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <Book className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-4xl font-bold">Travel Guides</h3>
                      <p className="text-muted-foreground text-lg">
                        Comprehensive guides with useful phrases for various situations like restaurants, markets, and
                        transportation.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center space-y-4 rounded-lg border bg-background p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <MessageSquare className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold">Phrasebook</h3>
                      <p className="text-muted-foreground">
                        Save, search, and manage your favorite phrases and translations for quick access when traveling.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center space-y-4 rounded-lg border bg-background p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <Award className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold">Progress Tracking</h3>
                      <p className="text-muted-foreground">
                        Track your learning journey with detailed statistics and celebrate your achievements.
                      </p>
                    </div>
                  </div>
                </div>
              </FadeInWhenVisible>
            </div>
          </div>
        </section>

        {/* How It Works - Timeline */}
        <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32 relative">
          <div className="container px-4 md:px-6">
            <FadeInWhenVisible>
              <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-4xl font-bold tracking-tighter sm:text-6xl">How It Works</h2>
                  <p className="max-w-[900px] text-muted-foreground text-xl md:text-4xl/relaxed">
                    A seamless experience from learning to real-world application
                  </p>
                </div>
              </div>
            </FadeInWhenVisible>

            <div className="mx-auto max-w-6xl">
              <Timeline data={timelineData} />
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="w-full py-12 md:py-24 lg:py-32 bg-orange-50 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/placeholder.svg?height=20&width=20')] opacity-5"></div>
          <div className="container px-4 md:px-6 relative">
            <FadeInWhenVisible>
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                  <Star className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-4xl font-bold tracking-tighter sm:text-6xl">What Our Users Say</h2>
                  <p className="max-w-[900px] text-muted-foreground text-xl md:text-4xl/relaxed">
                    Hear from language learners who have transformed their travel experiences with Lingual
                  </p>
                </div>
              </div>
            </FadeInWhenVisible>

            <div className="mx-auto max-w-4xl py-12 relative">
              <AnimatedTestimonialsBasic />
            </div>
          </div>
        </section>

        {/* App Screenshots */}
        <section id="screenshots" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <FadeInWhenVisible>
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                  <Camera className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-4xl font-bold tracking-tighter sm:text-6xl">App Screenshots</h2>
                  <p className="max-w-[900px] text-muted-foreground text-xl md:text-4xl/relaxed">
                    Take a closer look at the intuitive interface and engaging features
                  </p>
                </div>
              </div>
            </FadeInWhenVisible>

            {/* Improved Screenshots Gallery */}
            <div className="mt-16 relative">
              <div className="grid grid-cols-12 gap-4">
                {/* Large Screenshot - Home */}
                <div className="col-span-12 md:col-span-6 lg:col-span-4 row-span-2">
                  <FadeInWhenVisible delay={0.1}>
                    <div className="relative group h-full">
                      <div className="absolute inset-0 bg-primary rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                      <div className="bg-white rounded-xl p-4 shadow-lg h-full flex flex-col">
                        <div className="flex items-center mb-3">
                          <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
                          <div className="h-3 w-3 rounded-full bg-yellow-500 mr-2"></div>
                          <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        </div>
                        <div className="flex-grow flex items-center justify-center p-2">
                          <div className="relative h-[600px] w-[300px] rounded-xl overflow-hidden border-4 border-gray-200">
                            <Image
                              src="/Home.jpg"
                              alt="Home Screen"
                              width={300}
                              height={600}
                              className="object-cover h-full w-full"
                            />
                          </div>
                        </div>
                        <p className="text-center font-medium text-xl mt-4">Home Dashboard</p>
                      </div>
                    </div>
                  </FadeInWhenVisible>
                </div>

                {/* Camera Translation */}
                <div className="col-span-12 md:col-span-6 lg:col-span-4">
                  <FadeInWhenVisible delay={0.2}>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-primary rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                      <div className="bg-white rounded-xl p-4 shadow-lg">
                        <div className="flex items-center mb-3">
                          <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
                          <div className="h-3 w-3 rounded-full bg-yellow-500 mr-2"></div>
                          <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        </div>
                        <div className="flex items-center justify-center p-2">
                          <div className="relative h-[350px] w-[180px] rounded-xl overflow-hidden border-4 border-gray-200">
                            <Image
                              src="/camera.jpg"
                              alt="Camera Translation"
                              width={180}
                              height={350}
                              className="object-cover h-full w-full"
                            />
                          </div>
                        </div>
                        <p className="text-center font-medium text-lg mt-3">Camera Translation</p>
                      </div>
                    </div>
                  </FadeInWhenVisible>
                </div>

                {/* Voice Translation */}
                <div className="col-span-12 md:col-span-6 lg:col-span-4">
                  <FadeInWhenVisible delay={0.3}>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-primary rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                      <div className="bg-white rounded-xl p-4 shadow-lg">
                        <div className="flex items-center mb-3">
                          <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
                          <div className="h-3 w-3 rounded-full bg-yellow-500 mr-2"></div>
                          <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        </div>
                        <div className="flex items-center justify-center p-2">
                          <div className="relative h-[350px] w-[180px] rounded-xl overflow-hidden border-4 border-gray-200">
                            <Image
                              src="/Voicetranslate.jpg"
                              alt="Voice Translation"
                              width={180}
                              height={350}
                              className="object-cover h-full w-full"
                            />
                          </div>
                        </div>
                        <p className="text-center font-medium text-lg mt-3">Voice Translation</p>
                      </div>
                    </div>
                  </FadeInWhenVisible>
                </div>

                {/* Text Translation */}
                <div className="col-span-12 md:col-span-6 lg:col-span-4">
                  <FadeInWhenVisible delay={0.4}>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-primary rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                      <div className="bg-white rounded-xl p-4 shadow-lg">
                        <div className="flex items-center mb-3">
                          <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
                          <div className="h-3 w-3 rounded-full bg-yellow-500 mr-2"></div>
                          <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        </div>
                        <div className="flex items-center justify-center p-2">
                          <div className="relative h-[350px] w-[180px] rounded-xl overflow-hidden border-4 border-gray-200">
                            <Image
                              src="/texttranslation.jpg"
                              alt="Text Translation"
                              width={180}
                              height={350}
                              className="object-cover h-full w-full"
                            />
                          </div>
                        </div>
                        <p className="text-center font-medium text-lg mt-3">Text Translation</p>
                      </div>
                    </div>
                  </FadeInWhenVisible>
                </div>

                {/* Quiz */}
                <div className="col-span-12 md:col-span-6 lg:col-span-4">
                  <FadeInWhenVisible delay={0.5}>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-primary rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                      <div className="bg-white rounded-xl p-4 shadow-lg">
                        <div className="flex items-center mb-3">
                          <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
                          <div className="h-3 w-3 rounded-full bg-yellow-500 mr-2"></div>
                          <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        </div>
                        <div className="flex items-center justify-center p-2">
                          <div className="relative h-[350px] w-[180px] rounded-xl overflow-hidden border-4 border-gray-200">
                            <Image
                              src="/Quiz.jpg"
                              alt="Quiz Screen"
                              width={180}
                              height={350}
                              className="object-cover h-full w-full"
                            />
                          </div>
                        </div>
                        <p className="text-center font-medium text-lg mt-3">Learning Quizzes</p>
                      </div>
                    </div>
                  </FadeInWhenVisible>
                </div>

                {/* Phrases */}
                <div className="col-span-12 md:col-span-6 lg:col-span-4">
                  <FadeInWhenVisible delay={0.6}>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-primary rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                      <div className="bg-white rounded-xl p-4 shadow-lg">
                        <div className="flex items-center mb-3">
                          <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
                          <div className="h-3 w-3 rounded-full bg-yellow-500 mr-2"></div>
                          <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        </div>
                        <div className="flex items-center justify-center p-2">
                          <div className="relative h-[350px] w-[180px] rounded-xl overflow-hidden border-4 border-gray-200">
                            <Image
                              src="/Phrases.jpg"
                              alt="Phrases Screen"
                              width={180}
                              height={350}
                              className="object-cover h-full w-full"
                            />
                          </div>
                        </div>
                        <p className="text-center font-medium text-lg mt-3">Useful Phrases</p>
                      </div>
                    </div>
                  </FadeInWhenVisible>
                </div>

                {/* Profile */}
                <div className="col-span-12 md:col-span-6 lg:col-span-4">
                  <FadeInWhenVisible delay={0.7}>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-primary rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                      <div className="bg-white rounded-xl p-4 shadow-lg">
                        <div className="flex items-center mb-3">
                          <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
                          <div className="h-3 w-3 rounded-full bg-yellow-500 mr-2"></div>
                          <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        </div>
                        <div className="flex items-center justify-center p-2">
                          <div className="relative h-[350px] w-[180px] rounded-xl overflow-hidden border-4 border-gray-200">
                            <Image
                              src="/Profile.jpg"
                              alt="Profile Screen"
                              width={180}
                              height={350}
                              className="object-cover h-full w-full"
                            />
                          </div>
                        </div>
                        <p className="text-center font-medium text-lg mt-3">User Profile</p>
                      </div>
                    </div>
                  </FadeInWhenVisible>
                </div>

                {/* Landing */}
                <div className="col-span-12 md:col-span-6 lg:col-span-4">
                  <FadeInWhenVisible delay={0.8}>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-primary rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                      <div className="bg-white rounded-xl p-4 shadow-lg">
                        <div className="flex items-center mb-3">
                          <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
                          <div className="h-3 w-3 rounded-full bg-yellow-500 mr-2"></div>
                          <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        </div>
                        <div className="flex items-center justify-center p-2">
                          <div className="relative h-[300px] w-[150px] rounded-xl overflow-hidden border-4 border-gray-200">
                            <Image
                              src="/Landing.jpg"
                              alt="Landing Screen"
                              width={150}
                              height={300}
                              className="object-cover h-full w-full"
                            />
                          </div>
                        </div>
                        <p className="text-center font-medium mt-3">Welcome Screen</p>
                      </div>
                    </div>
                  </FadeInWhenVisible>
                </div>

                {/* Register */}
                <div className="col-span-12 md:col-span-6 lg:col-span-4">
                  <FadeInWhenVisible delay={0.9}>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-primary rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                      <div className="bg-white rounded-xl p-4 shadow-lg">
                        <div className="flex items-center mb-3">
                          <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
                          <div className="h-3 w-3 rounded-full bg-yellow-500 mr-2"></div>
                          <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        </div>
                        <div className="flex items-center justify-center p-2">
                          <div className="relative h-[300px] w-[150px] rounded-xl overflow-hidden border-4 border-gray-200">
                            <Image
                              src="/Register.jpg"
                              alt="Register Screen"
                              width={150}
                              height={300}
                              className="object-cover h-full w-full"
                            />
                          </div>
                        </div>
                        <p className="text-center font-medium mt-3">Registration</p>
                      </div>
                    </div>
                  </FadeInWhenVisible>
                </div>

                {/* Llama Model */}
                <div className="col-span-12 md:col-span-6 lg:col-span-4">
                  <FadeInWhenVisible delay={1.0}>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-primary rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                      <div className="bg-white rounded-xl p-4 shadow-lg">
                        <div className="flex items-center mb-3">
                          <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
                          <div className="h-3 w-3 rounded-full bg-yellow-500 mr-2"></div>
                          <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        </div>
                        <div className="flex items-center justify-center p-2">
                          <div className="relative h-[300px] w-[150px] rounded-xl overflow-hidden border-4 border-gray-200">
                            <Image
                              src="/Llama.jpg"
                              alt="Llama Model"
                              width={150}
                              height={300}
                              className="object-cover h-full w-full"
                            />
                          </div>
                        </div>
                        <p className="text-center font-medium mt-3">AI Assistant</p>
                      </div>
                    </div>
                  </FadeInWhenVisible>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Download Section */}
        <section id="download" className="w-full py-12 md:py-24 lg:py-32 border-t bg-orange-50 relative">
          <div className="absolute inset-0 bg-[url('/placeholder.svg?height=20&width=20')] opacity-5"></div>
          <div className="container px-4 md:px-6 relative">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
              <FadeInWhenVisible>
                <div className="flex flex-col justify-center space-y-4">
                  <div className="space-y-2">
                    <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                      Ready to start your language journey?
                    </h2>
                    <p className="max-w-[700px] text-muted-foreground text-xl md:text-4xl/relaxed">
                      Download the app today and transform the way you learn languages. Available now on Google Drive
                      with Play Store release coming soon.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 min-[400px]:flex-row">
                    <Button
                      size="lg"
                      className="gap-1 bg-primary hover:bg-primary/90 transition-all duration-200 transform hover:scale-105"
                      asChild
                    >
                      <Link href="https://drive.google.com" target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-5 w-5" />
                        Download from Google Drive
                        <ExternalLink className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                  <div className="flex items-center space-x-4 pt-4">
                    <Badge variant="outline" className="text-sm">
                      Coming Soon
                    </Badge>
                    <div className="flex items-center space-x-1">
                      <Image
                        src="/placeholder.svg?height=40&width=120"
                        width={120}
                        height={40}
                        alt="Google Play Store"
                        className="h-10 w-auto"
                      />
                    </div>
                  </div>
                </div>
              </FadeInWhenVisible>

              <FadeInWhenVisible delay={0.2}>
                <div className="flex items-center justify-center">
                  <div className="relative h-[600px] w-[300px] rounded-[40px] border-8 border-muted bg-background p-2 shadow-xl transform transition-transform hover:scale-105 duration-300">
                    <div className="relative h-full w-full overflow-hidden rounded-[28px] bg-muted">
                      <Image
                        src="/Home.jpg"
                        width={300}
                        height={600}
                        alt="App screenshot - Home screen"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </FadeInWhenVisible>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-base leading-loose text-muted-foreground md:text-left">
            © {new Date().getFullYear()} Lingual. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-base text-muted-foreground underline-offset-4 hover:underline">
              Privacy Policy
            </Link>
            <Link href="#" className="text-base text-muted-foreground underline-offset-4 hover:underline">
              Terms of Service
            </Link>
            <Link href="#" className="text-base text-muted-foreground underline-offset-4 hover:underline">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
